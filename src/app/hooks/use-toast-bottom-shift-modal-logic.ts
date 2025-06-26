import { useCallback, useEffect, useRef } from 'react';

import { useToastsContainerBottomShift } from 'lib/temple/front/toasts-context';

export const useToastBottomShiftModalLogic = (modalOpened: boolean, shouldChangeBottomShift: boolean) => {
  const [bottomShift, setBottomShift] = useToastsContainerBottomShift();

  const beforeOpenBottomShift = useRef<number>();

  useEffect(() => {
    if (modalOpened && !beforeOpenBottomShift.current) beforeOpenBottomShift.current = bottomShift;
  }, [bottomShift, modalOpened]);

  const callback = useCallback(() => void setBottomShift(beforeOpenBottomShift.current ?? 0), [setBottomShift]);

  useEffect(() => {
    if (shouldChangeBottomShift) {
      if (modalOpened) setBottomShift(0);
      else callback();
    }
  }, [callback, modalOpened, setBottomShift, shouldChangeBottomShift]);

  return callback;
};
