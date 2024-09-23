import { FocusEvent, FocusEventHandler, useCallback, useState } from 'react';

import { blurHandler, focusHandler } from '../inputHandlers';

const defaultShouldHandle = (_e: FocusEvent) => true;

export const useFocusHandlers = (
  focusCallback?: FocusEventHandler,
  blurCallback?: FocusEventHandler,
  shouldHandleFocus = defaultShouldHandle,
  shouldHandleBlur = defaultShouldHandle
) => {
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(
    (e: FocusEvent) => {
      if (shouldHandleFocus(e)) {
        focusHandler(e, focusCallback, setIsFocused);
      }
    },
    [focusCallback, shouldHandleFocus]
  );
  const onBlur = useCallback(
    (e: FocusEvent) => {
      if (shouldHandleBlur(e)) {
        blurHandler(e, blurCallback, setIsFocused);
      }
    },
    [blurCallback, shouldHandleBlur]
  );

  return { isFocused, onFocus, onBlur, setIsFocused };
};
