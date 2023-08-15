import React, { useState } from 'react';

import { ReactComponent as EyeClosedBold } from 'app/icons/eye-closed-bold.svg';
import { ReactComponent as EyeOpenBold } from 'app/icons/eye-open-bold.svg';

const usePasswordToggle = (): [string, JSX.Element] => {
  const [visible, setVisibility] = useState(false);

  const Icon = (
    <button type="button" tabIndex={1} className="absolute inset-y-0 right-3" onClick={() => setVisibility(!visible)}>
      {visible ? <EyeClosedBold /> : <EyeOpenBold />}
    </button>
  );

  const inputType = visible ? 'text' : 'password';

  return [inputType, Icon];
};

export default usePasswordToggle;
