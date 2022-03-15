import React, { useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as EyeClosedBold } from '../icons/eye-closed-bold.svg';
import { ReactComponent as EyeOpenBold } from '../icons/eye-open-bold.svg';

const usePasswordToggle = (): [string, JSX.Element] => {
  const [visible, setVisibility] = useState(false);

  const Icon = (
    <button
      type="button"
      tabIndex={1}
      className={classNames('absolute inset-y-0 right-3')}
      onClick={() => setVisibility(!visible)}
    >
      {visible ? <EyeClosedBold /> : <EyeOpenBold />}
    </button>
  );

  const inputType = visible ? 'text' : 'password';

  return [inputType, Icon];
};

export default usePasswordToggle;
