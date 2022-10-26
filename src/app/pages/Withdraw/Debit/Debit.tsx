import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { Link } from 'lib/woozie/Link';

import { ReactComponent as AliceBobIcon } from '../../Buy/assets/AliceBob.svg';

export const Debit: FC = () => {
  return (
    <div className={classNames('mx-auto max-w-sm flex flex-col items-center', 'border-2 rounded-md p-4 mb-4')}>
      <AliceBobIcon />
      <div className="text-lg text-center mt-4">
        <T id="sellWithAliceBob" />
      </div>
      <div className="text-center px-2 mt-2 mx-auto text-gray-700">
        <T id="sellWithAliceBobDescription" />
      </div>
      <Link
        className={classNames(
          'py-2 px-4 rounded mt-4',
          'border-2',
          'border-blue-500 hover:border-blue-600 focus:border-blue-600',
          'flex items-center justify-center',
          'text-white',
          'shadow-sm hover:shadow focus:shadow',
          'text-base font-medium',
          'transition ease-in-out duration-300',
          'bg-blue-500',
          'w-full'
        )}
        to="/withdraw/debit/alice-bob"
      >
        <T id="continue" />
      </Link>
    </div>
  );
};
