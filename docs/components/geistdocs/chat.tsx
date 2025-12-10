"use client";

import type { UIMessage } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRightIcon, MessagesSquareIcon, Trash } from "lucide-react";
import { Portal } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { harden } from "rehype-harden";
import { toast } from "sonner";
import { defaultRehypePlugins } from "streamdown";
import type { MyUIMessage } from "@/app/api/chat/types";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputProps,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useChatContext } from "@/hooks/geistdocs/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { db } from "@/lib/geistdocs/db";
import { cn } from "@/lib/utils";
import { ButtonGroup } from "../ui/button-group";
import { Kbd, KbdGroup } from "../ui/kbd";
import { Spinner } from "../ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { CopyChat } from "./copy-chat";
import { MessageMetadata } from "./message-metadata";

export const useChatPersistence = () => {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Load messages from Dexie with live query
  const storedMessages = useLiveQuery(() =>
    db.messages.orderBy("sequence").toArray()
  );

  const initialMessages =
    storedMessages?.map(({ timestamp, sequence, ...message }) => message) ?? [];

  const isLoading = storedMessages === undefined;

  // Save messages to Dexie with debouncing
  const saveMessages = useCallback((messages: UIMessage[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const baseTimestamp = Date.now();
        const messagesToStore = messages.map((message, index) => ({
          ...message,
          timestamp: baseTimestamp + index * 1000,
          sequence: index,
        }));

        await db.transaction("rw", db.messages, async () => {
          await db.messages.clear();
          await db.messages.bulkAdd(messagesToStore);
        });
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
    }, 300);
  }, []);

  // Clear all messages from Dexie
  const clearMessages = useCallback(async () => {
    try {
      await db.messages.clear();
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    },
    []
  );

  return {
    initialMessages,
    isLoading,
    saveMessages,
    clearMessages,
  };
};

type ChatProps = {
  basePath: string | undefined;
  suggestions: string[];
};

const ChatInner = ({ basePath, suggestions }: ChatProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [localPrompt, setLocalPrompt] = useState("");
  const [providerKey, setProviderKey] = useState(0);
  const { prompt, setPrompt, setIsOpen } = useChatContext();
  const { initialMessages, isLoading, saveMessages, clearMessages } =
    useChatPersistence();

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: basePath ? `${basePath}/api/chat` : "/api/chat",
    }),
    onError: (error) => {
      toast.error(error.message, {
        description: error.message,
      });
    },
  });

  // Sync external prompt changes to local state and force provider remount
  useEffect(() => {
    if (prompt && prompt !== localPrompt) {
      setLocalPrompt(prompt);
      setProviderKey((prev) => prev + 1);
    }
  }, [prompt, localPrompt]);

  // Set initial messages once loaded from IndexedDB
  useEffect(() => {
    if (!(isLoading || isInitialized) && initialMessages.length > 0) {
      setMessages(initialMessages);
      setIsInitialized(true);
    } else if (!(isLoading || isInitialized)) {
      // Mark as initialized even if no messages to avoid infinite re-runs
      setIsInitialized(true);
    }
  }, [isLoading, initialMessages, isInitialized, setMessages]);

  // Save messages to IndexedDB whenever they change (but only after initialization)
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, saveMessages, isInitialized]);

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage({ text: suggestion });
    setLocalPrompt("");
    setPrompt("");
  };

  const handleSubmit: PromptInputProps["onSubmit"] = async (message, event) => {
    event.preventDefault();

    const { text } = message;

    if (!text) {
      return;
    }

    await sendMessage({ text });
    setLocalPrompt("");
    setPrompt("");
  };

  const handleClearChat = async () => {
    try {
      await clearMessages();
      setMessages([]);
      toast.success("Chat history cleared");
    } catch (error) {
      toast.error("Failed to clear chat history", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Show loading state while initial messages are being loaded
  if (isLoading) {
    return (
      <div className="flex size-full w-full flex-col items-center justify-center overflow-hidden whitespace-nowrap rounded-xl xl:max-w-md xl:border xl:bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex size-full w-full flex-col overflow-hidden whitespace-nowrap bg-background">
      <div className="flex items-center justify-between px-4 py-2.5">
        <h2 className="font-semibold text-sm">Chat</h2>
        <div className="flex items-center gap-3">
          <ButtonGroup orientation="horizontal">
            <CopyChat messages={messages} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={messages.length === 0}
                  onClick={handleClearChat}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsOpen(false)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ChevronRightIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close chat</TooltipContent>
            </Tooltip>
          </ButtonGroup>
        </div>
      </div>

      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <Message
              className="max-w-[90%]"
              from={message.role}
              key={message.id}
            >
              <MessageMetadata
                inProgress={status === "submitted"}
                parts={message.parts as MyUIMessage["parts"]}
              />
              {message.parts
                .filter((part) => part.type === "text")
                .map((part, index) => (
                  <MessageContent key={`${message.id}-${part.type}-${index}`}>
                    <MessageResponse
                      className="text-wrap"
                      rehypePlugins={[
                        defaultRehypePlugins.raw,
                        defaultRehypePlugins.katex,
                        [
                          harden,
                          {
                            defaultOrigin:
                              process.env
                                .NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
                          },
                        ],
                      ]}
                    >
                      {part.text}
                    </MessageResponse>
                  </MessageContent>
                ))}
            </Message>
          ))}
          {status === "submitted" && (
            <div className="size-12 text-muted-foreground text-sm">
              <Spinner />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton className="border-none bg-foreground text-background hover:bg-foreground/80 hover:text-background" />
      </Conversation>

      <div className="relative grid w-auto shrink-0 gap-4 p-4">
        {!messages.length && (
          <>
            <Suggestions className="flex-col items-start gap-px">
              {suggestions.map((text) => (
                <Suggestion
                  className="rounded-none p-0"
                  key={text}
                  onClick={handleSuggestionClick}
                  suggestion={text}
                  variant="link"
                />
              ))}
            </Suggestions>
            <p className="text-muted-foreground text-sm">
              Tip: You can open and close chat with{" "}
              <KbdGroup>
                <Kbd className="border bg-transparent">⌘</Kbd>
                <Kbd className="border bg-transparent">I</Kbd>
              </KbdGroup>
            </p>
          </>
        )}
        <PromptInputProvider initialInput={localPrompt} key={providerKey}>
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputBody>
              <PromptInputTextarea
                maxLength={1000}
                onChange={(e) => {
                  setLocalPrompt(e.target.value);
                  setPrompt(e.target.value);
                }}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <p className="text-muted-foreground text-xs">
                {localPrompt.length} / 1000
              </p>
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
};

export const Chat = ({ basePath, suggestions }: ChatProps) => {
  const { isOpen, setIsOpen } = useChatContext();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Meta (⌘ on Mac, Windows key on Windows) + "i" (ignore case)
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "i"
      ) {
        event.preventDefault();

        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setIsOpen]);

  return (
    <>
      <Button
        className="hidden shrink-0 shadow-none md:flex"
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        variant="outline"
      >
        <MessagesSquareIcon className="size-3.5 text-muted-foreground" />
        <span>Ask AI</span>
      </Button>

      <Portal.Root className="hidden md:block">
        <div
          className={cn(
            "fixed z-50 flex flex-col gap-4 bg-background transition-all",
            "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
            "translate-x-full data-[state=open]:translate-x-0"
          )}
          data-state={isOpen ? "open" : "closed"}
        >
          <ChatInner basePath={basePath} suggestions={suggestions} />
        </div>
      </Portal.Root>
      <div className="md:hidden">
        <Drawer
          onOpenChange={isMobile ? setIsOpen : undefined}
          open={isMobile ? isOpen : false}
        >
          <DrawerTrigger asChild>
            <Button className="shadow-none" size="sm" variant="outline">
              <MessagesSquareIcon className="size-3.5 text-muted-foreground" />
              Ask AI
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80dvh]">
            <ChatInner basePath={basePath} suggestions={suggestions} />
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};
