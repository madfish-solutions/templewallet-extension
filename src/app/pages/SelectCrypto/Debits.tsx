import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { useNetwork } from 'lib/temple/front';
import Link from 'lib/woozie/Link';

import { ReactComponent as AliceBobIcon } from './assets/AliceBob.svg';
import ChainBitsIcon from './assets/ChainBits.png';
import { ReactComponent as MoonPayIcon } from './assets/MoonPay.svg';
import { MoonPay } from './MoonPay/MoonPay';

export const Debits: FC = () => {
  const network = useNetwork();

  return (
    <div>
      {network.type === 'main' && (
        <div className={classNames('mx-auto max-w-sm flex flex-col items-center', 'border-2 rounded-md p-4 mb-4')}>
          <MoonPayIcon />
          <div className="text-lg text-center mt-2">
            <T id="buyWithMoonPay" />
          </div>
          <div className="text-center w-64 mx-auto text-gray-700 mt-2">
            <T id="buyWithMoonPayDescription" />
          </div>
          <MoonPay />
        </div>
      )}
      {network.type === 'main' && (
        <div className={classNames('mx-auto max-w-sm flex flex-col items-center', 'border-2 rounded-md p-4 mb-4')}>
          <AliceBobIcon />
          <div className="text-lg text-center mt-4">
            <T id="buyWithAliceBob" />
          </div>
          <div className="text-center px-2 mt-2 mx-auto text-gray-700">
            <T id="buyWithAliceBobDescription" />
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
            to="/buy/debit/alice-bob"
          >
            <T id="continue" />
          </Link>
        </div>
      )}
      {network.type === 'dcp' && (
        <div className={classNames('mx-auto max-w-sm flex flex-col items-center', 'border-2 rounded-md p-4 mb-4')}>
          <img src={ChainBitsIcon} alt="ChainBits" width={256} />
          <div className="text-lg text-center mt-2">
            <T id="buyWithChainBits" />
          </div>
          <div className="text-center w-64 mx-auto text-gray-700 mt-2">
            <T id="buyWithChainBitsDescription" />
          </div>
          <a
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
            href="https://buy.chainbits.com/?crypto=FILM"
            target="_blank"
            rel="noopener noreferrer"
          >
            <T id="continue" />
          </a>
        </div>
      )}
    </div>
  );
};
