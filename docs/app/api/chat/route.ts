import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
import { createTools } from "./tools";
import type { MyUIMessage } from "./types";
import { createSystemPrompt } from "./utils";

export const maxDuration = 800;

type RequestBody = {
  messages: MyUIMessage[];
  currentRoute: string;
  pageContext?: {
    title: string;
    url: string;
    content: string;
  };
};

export async function POST(req: Request) {
  try {
    const { messages, currentRoute, pageContext }: RequestBody =
      await req.json();

    // Filter out UI-only page context messages (they're just visual feedback)
    const actualMessages = messages.filter(
      (msg) => !msg.metadata?.isPageContext
    );

    // If pageContext is provided, prepend it to the last user message
    let processedMessages = actualMessages;

    if (pageContext && actualMessages.length > 0) {
      const lastMessage = actualMessages.at(-1);

      if (!lastMessage) {
        return new Response(
          JSON.stringify({
            error: "No last message found",
          }),
          { status: 500 }
        );
      }

      if (lastMessage.role === "user") {
        // Extract text content from the message parts
        const userQuestion = lastMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");

        processedMessages = [
          ...actualMessages.slice(0, -1),
          {
            ...lastMessage,
            parts: [
              {
                type: "text",
                text: `Here's the content from the current page:

**Page:** ${pageContext.title}
**URL:** ${pageContext.url}

---

${pageContext.content}

---

User question: ${userQuestion}`,
              },
            ],
          },
        ];
      }
    }

    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        const result = streamText({
          model: "openai/gpt-4.1-mini",
          messages: convertToModelMessages(processedMessages),
          stopWhen: stepCountIs(10),
          tools: createTools(writer),
          system: createSystemPrompt(currentRoute),
          prepareStep: ({ stepNumber }) => {
            if (stepNumber === 0) {
              return { toolChoice: { type: "tool", toolName: "search_docs" } };
            }
          },
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("AI chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
