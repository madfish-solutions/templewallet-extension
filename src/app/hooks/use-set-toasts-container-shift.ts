import { useCallback, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { setToastsContainerBottomShiftAction } from 'app/store/toasts-container-shift/actions';

export const useSetToastsContainerShift = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => void dispatch(setToastsContainerBottomShiftAction(0));
  }, []);

  return useCallback(
    (bottomShift: number) => {
      dispatch(setToastsContainerBottomShiftAction(bottomShift));
    },
    [dispatch]
  );
};
