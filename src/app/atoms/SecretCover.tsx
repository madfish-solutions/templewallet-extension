import React from 'react';

import { ReactComponent as LockAltIcon } from 'app/icons/lock-alt.svg';
import { setTestID, TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';

interface Props extends TestIDProps {
  onClick: () => void;
}

export const SecretCover: React.FC<Props> = ({ onClick, testID }) => (
  <div
    className="absolute flex flex-col items-center justify-center rounded-md bg-gray-200 cursor-text"
    style={{
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    }}
    onClick={onClick}
    {...setTestID(testID)}
  >
    <p className="flex items-center mb-1 uppercase text-gray-600 text-lg font-semibold text-shadow-black">
      <LockAltIcon className="-ml-2 mr-1 h-6 w-auto stroke-current stroke-2" />
      <span>
        <T id="protectedFormField" />
      </span>
    </p>

    <p className="mb-1 flex items-center text-gray-500 text-sm">
      <span>
        <T id="clickToRevealField" />
      </span>
    </p>
  </div>
);
