import React from 'react';

import { ReactComponent as LockAltIcon } from 'app/icons/monochrome/lock-alt.svg';
import ProtectedFieldCoverSrc from 'app/misc/protected-field-cover.gif';
import { setTestID, TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';

interface Props extends TestIDProps {
  singleRow?: boolean;
  onClick: EmptyFn;
}

export const SecretCover: React.FC<Props> = ({ onClick, singleRow, testID }) => (
  <div
    className="flex flex-col items-center justify-center rounded-lg cursor-pointer text-black absolute inset-0"
    style={{ background: `url(${ProtectedFieldCoverSrc}) lightgray 50% / cover no-repeat` }}
    onClick={onClick}
    {...setTestID(testID)}
  >
    {singleRow ? (
      <p className="flex items-center text-font-medium">
        <LockAltIcon className="mr-1 w-4 h-auto fill-current" />
        <span>
          <T id="clickToReveal" />
        </span>
      </p>
    ) : (
      <>
        <LockAltIcon className="mb-3 w-10 h-auto fill-current" />
        <p className="text-center mb-1 uppercase font-bold text-xl leading-tight">
          <T id="protectedFormField" />
        </p>

        <p className="text-center font-semibold text-ulg leading-tight">
          <T id="clickToRevealField" />
        </p>
      </>
    )}
  </div>
);
