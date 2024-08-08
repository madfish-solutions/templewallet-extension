import React, { useCallback, useMemo, useState } from 'react';

import { ReactComponent as EyeClosedBold } from 'app/icons/eye-closed-bold.svg';
import { ReactComponent as EyeOpenBold } from 'app/icons/eye-open-bold.svg';
import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';
import { useDidUpdate, useTimeout } from 'lib/ui/hooks';

const usePasswordToggle = (
  id?: string,
  onReveal?: EmptyFn,
  revealRef?: unknown,
  handleBlur?: (e: React.FocusEvent) => void
): ['text' | 'password', JSX.Element] => {
  const [visible, setVisibility] = useState(false);

  const buttonId = useMemo(() => (id ? `passwordToggle-${id}` : undefined), [id]);

  const hide = useCallback(() => void setVisibility(false), []);

  useDidUpdate(hide, [revealRef]);

  useTimeout(hide, USER_ACTION_TIMEOUT, visible);

  const Icon = useMemo(
    () => (
      <button
        id={buttonId}
        type="button"
        tabIndex={1}
        onClick={() => {
          if (!visible) {
            onReveal?.();
          }
          setVisibility(prev => !prev);
        }}
        onBlur={handleBlur}
      >
        {visible ? <EyeClosedBold /> : <EyeOpenBold />}
      </button>
    ),
    [handleBlur, visible, onReveal]
  );

  const inputType = visible ? 'text' : 'password';

  return [inputType, Icon];
};

export default usePasswordToggle;
