import React, { useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as EyeClosedBold } from '../icons/eye-closed-bold.svg';
import { ReactComponent as EyeOpenBold } from '../icons/eye-open-bold.svg';

const usePasswordToggle = () => {
  const [visible, setVisibility] = useState(false);

  const Icon = (
    <button type="button" className={classNames('absolute inset-y-0 right-3')} onClick={() => setVisibility(!visible)}>
      {visible ? <EyeClosedBold /> : <EyeOpenBold />}
    </button>
  );

  const InputType = visible ? 'text' : 'password';

  return [InputType, Icon] as const;
};

export default usePasswordToggle;
