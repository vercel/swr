import { atom, useAtom } from "jotai";

// Export the sidebar open state atom so it can be used from other parts of the app
export const sidebarOpenAtom = atom<boolean>(false);

export const useSidebarContext = () => {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);

  return {
    isOpen,
    setIsOpen,
  };
};
