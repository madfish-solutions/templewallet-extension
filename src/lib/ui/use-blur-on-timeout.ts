import { RefObject, MutableRefObject, useEffect } from 'react';

import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';

export const useBlurElementOnTimeout = <E extends HTMLOrSVGElement>(
  ref: RefObject<E | nullish> | MutableRefObject<E | nullish>,
  condition: boolean,
  timeout = USER_ACTION_TIMEOUT,
  callback?: () => void
) => {
  useEffect(() => {
    if (!condition) return;

    const handleLocalBlur = () => {
      ref.current?.blur();
      callback?.();
    };

    const timeoutId = setTimeout(handleLocalBlur, timeout);

    window.addEventListener('blur', handleLocalBlur);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('blur', handleLocalBlur);
    };
  }, [ref, condition, timeout, callback]);
};
