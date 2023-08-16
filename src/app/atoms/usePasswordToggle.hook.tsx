import React, { useCallback, useState } from 'react';

import clsx from 'clsx';

import { ReactComponent as EyeClosedBold } from 'app/icons/eye-closed-bold.svg';
import { ReactComponent as EyeOpenBold } from 'app/icons/eye-open-bold.svg';
import { useTimeout } from 'lib/ui/hooks';

const usePasswordToggle = (smallPaddings: boolean): ['text' | 'password', JSX.Element] => {
  const [visible, setVisibility] = useState(false);

  const onTimeout = useCallback(() => void setVisibility(false), []);
  useTimeout(visible, onTimeout);

  const Icon = (
    <button
      type="button"
      tabIndex={1}
      className={clsx('absolute inset-y-0', smallPaddings ? 'right-2' : 'right-3')}
      onClick={() => setVisibility(!visible)}
    >
      {visible ? <EyeClosedBold /> : <EyeOpenBold />}
    </button>
  );

  const inputType = visible ? 'text' : 'password';

  return [inputType, Icon];
};

export default usePasswordToggle;
