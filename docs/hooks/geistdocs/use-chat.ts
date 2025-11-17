import { atom, useAtom } from "jotai";

// Export the prompt atom so it can be used from other parts of the app
export const chatPromptAtom = atom<string>("");

// Export the open state atom for controlling chat visibility
export const chatOpenAtom = atom<boolean>(false);

export const useChatContext = () => {
  const [prompt, setPrompt] = useAtom(chatPromptAtom);
  const [isOpen, setIsOpen] = useAtom(chatOpenAtom);

  return {
    prompt,
    setPrompt,
    isOpen,
    setIsOpen,
  };
};
