import { RefObject, useCallback, useEffect } from 'react';

export const useModalScrollLock = (shouldLock: boolean, modalRef: RefObject<HTMLElement>) => {
  const handleWheelEvent = useCallback(
    (e: WheelEvent) => {
      if (shouldLock && !modalRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [modalRef, shouldLock]
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheelEvent);
    };
  }, [handleWheelEvent]);
};
