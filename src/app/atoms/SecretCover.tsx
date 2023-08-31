import React from 'react';

import clsx from 'clsx';

import { ReactComponent as LockAltIcon } from 'app/icons/lock-alt.svg';
import { setTestID, TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';

interface Props extends TestIDProps {
  singleRow?: boolean;
  onClick: () => void;
}

export const SecretCover: React.FC<Props> = ({ onClick, singleRow, testID }) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center rounded-md bg-gray-200 cursor-pointer',
      'absolute top-2px left-2px right-2px bottom-2px'
    )}
    onClick={onClick}
    {...setTestID(testID)}
  >
    {singleRow ? (
      <p className="flex items-center text-gray-500 text-sm">
        <LockAltIcon className="mr-1 h-4 w-auto stroke-current stroke-2" />
        <span>
          <T id="clickToReveal" />
        </span>
      </p>
    ) : (
      <>
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
      </>
    )}
  </div>
);
