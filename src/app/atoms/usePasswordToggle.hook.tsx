import { ReactNode, useCallback, useMemo, useState } from 'react';

import { ReactComponent as EyeClose } from 'app/icons/base/eye_close.svg';
import { ReactComponent as EyeOpen } from 'app/icons/base/eye_open.svg';
import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';
import { useDidUpdate, useTimeout } from 'lib/ui/hooks';

import { IconBase } from './IconBase';

const usePasswordToggle = (
  id?: string,
  onReveal?: EmptyFn,
  revealRef?: unknown,
  handleBlur?: (e: React.FocusEvent) => void
): ['text' | 'password', ReactNode] => {
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
        <IconBase size={16} Icon={visible ? EyeOpen : EyeClose} className="text-primary" />
      </button>
    ),
    [buttonId, handleBlur, visible, onReveal]
  );

  const inputType = visible ? 'text' : 'password';

  return [inputType, Icon];
};

export default usePasswordToggle;
