import { useRef, useState } from 'react';

const OPEN_DELAY_MS = 200;
const CLOSE_DELAY_MS = 150;

let activeSetOpen: ReactSetStateFn<boolean> | null = null;

export const useHoverCard = () => {
  const [open, setOpen] = useState(false);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelOpen = () => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleEnter = () => {
    cancelClose();
    openTimerRef.current = setTimeout(() => {
      if (activeSetOpen && activeSetOpen !== setOpen) activeSetOpen(false);
      activeSetOpen = setOpen;
      setOpen(true);
      openTimerRef.current = null;
    }, OPEN_DELAY_MS);
  };

  const handleLeave = () => {
    cancelOpen();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      if (activeSetOpen === setOpen) activeSetOpen = null;
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  };

  const close = () => {
    cancelOpen();
    cancelClose();
    setOpen(false);
  };

  return { open, handleEnter, handleLeave, cancelClose, close };
};
