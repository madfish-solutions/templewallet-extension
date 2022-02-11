import React, { FC } from 'react';

import classNames from 'clsx';

import Name from 'app/atoms/Name';
import { ReactComponent as FaucetIcon } from 'app/misc/faucet.svg';
import { T } from 'lib/i18n/react';
import { useNetwork } from 'lib/temple/front';

const FAUCET_URL = 'https://t.me/tezos_faucet_bot';

export const Faucet: FC = () => {
  const network = useNetwork();

  return network.type === 'test' ? (
    <div className="mt-8 w-full">
      <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
        <span className="text-base font-semibold text-gray-700">
          <T id="depositToWallet" />
        </span>

        <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
          <T id="depositToWalletDescription" />
        </span>
      </h2>
      <div
        className={classNames(
          'w-full',
          'rounded-md overflow-hidden',
          'border-2 bg-gray-100',
          'flex flex-col',
          'text-gray-700 text-sm leading-tight'
        )}
      >
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'block w-full',
            'overflow-hidden',
            'border-b border-gray-200',
            'hover:bg-gray-200 focus:bg-gray-200',
            'flex items-stretch',
            'text-gray-700',
            'transition ease-in-out duration-200',
            'focus:outline-none',
            'opacity-90 hover:opacity-100'
          )}
          style={{
            padding: '0.65rem 0.5rem 0.65rem 0.5rem'
          }}
        >
          <div className={classNames('flex-shrink-0', 'w-auto h-auto', 'rounded shadow-xs')}>
            <FaucetIcon />
          </div>
          <div className="ml-2 flex flex-col items-start justify-center">
            <div className={classNames('flex flex-wrap items-center', 'leading-noneleading-none')}>
              <T id="tezosFaucet">{message => <Name className="text-base font-medium pb-1">{message}</Name>}</T>
            </div>
          </div>
        </a>
      </div>
    </div>
  ) : null;
};
