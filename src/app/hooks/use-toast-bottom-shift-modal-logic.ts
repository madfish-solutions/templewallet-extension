import { useCallback, useEffect, useRef } from 'react';

import { useToastsContainerBottomShift } from 'lib/temple/front/toasts-context';

export const useToastBottomShiftModalLogic = (modalOpened: boolean) => {
  const [bottomShift, setBottomShift] = useToastsContainerBottomShift();

  const beforeOpenBottomShift = useRef<number>();

  useEffect(() => {
    if (modalOpened && !beforeOpenBottomShift.current) beforeOpenBottomShift.current = bottomShift;
  }, [bottomShift, modalOpened]);

  useEffect(() => {
    if (modalOpened) setBottomShift(0);
  }, [modalOpened, setBottomShift]);

  return useCallback(() => void setBottomShift(beforeOpenBottomShift.current ?? 0), [setBottomShift]);
};
