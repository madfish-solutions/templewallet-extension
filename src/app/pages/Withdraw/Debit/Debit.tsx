import React, { memo, useMemo } from 'react';

import { ChainIds } from '@taquito/taquito';
import clsx from 'clsx';

import { ReactComponent as AliceBobIcon } from 'app/pages/Buy/assets/AliceBob.svg';
import { useNetworkSelectController, NetworkSelect } from 'app/templates/NetworkSelect';
import { T } from 'lib/i18n/react';
import { Link } from 'lib/woozie/Link';

export const Debit = memo(() => {
  const networkSelectController = useNetworkSelectController(true);
  const network = networkSelectController.network;

  const disabled = network.chainId !== ChainIds.MAINNET;

  const buttonClassName = useMemo(
    () =>
      clsx(
        'w-full mt-4 py-2 px-4 rounded',
        'text-white bg-blue-500 border-2',
        'border-blue-500 hover:border-blue-600 focus:border-blue-600',
        'flex items-center justify-center',
        'shadow-sm hover:shadow focus:shadow',
        'text-base font-medium',
        'transition ease-in-out duration-300',
        disabled ? 'opacity-25 pointer-events-none cursor-default' : 'cursor-pointer'
      ),
    [disabled]
  );

  return (
    <div className="mx-auto max-w-sm flex flex-col items-center border-2 rounded-md p-4 mb-4">
      <AliceBobIcon />

      <div className="text-lg text-center mt-4">
        <T id="sellWithAliceBob" />
      </div>

      <div className="text-center px-2 mt-2 mb-4 mx-auto text-gray-700">
        <T id="sellWithAliceBobDescription" />
      </div>

      <NetworkSelect controller={networkSelectController} />

      <Link className={buttonClassName} to={`/withdraw/debit/alice-bob?networkId=${network.id}`}>
        <T id="continue" />
      </Link>
    </div>
  );
});
