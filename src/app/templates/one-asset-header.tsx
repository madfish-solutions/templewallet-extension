import React, { memo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { EvmAssetIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface OneAssetHeaderProps {
  className?: string;
  network: OneOfChains;
  assetSlug: string;
  amount: string;
}

export const OneAssetHeader = memo<OneAssetHeaderProps>(({ network, assetSlug, amount, className }) => {
  console.log('ebota 1', { network, assetSlug, amount });
  const isEvm = network.kind === TempleChainKind.EVM;

  return (
    <div className={clsx('flex flex-col justify-center items-center text-center', className)}>
      {isEvm ? (
        <EvmAssetIconWithNetwork evmChainId={network.chainId} assetSlug={assetSlug} />
      ) : (
        <TezosTokenIconWithNetwork tezosChainId={network.chainId} assetSlug={assetSlug} />
      )}

      <span className="text-font-num-bold-14 mt-2">{amount}</span>
      <InFiat
        chainId={network.chainId}
        assetSlug={assetSlug}
        volume={amount}
        smallFractionFont={false}
        roundingMode={BigNumber.ROUND_FLOOR}
        evm={isEvm}
      >
        {({ balance, symbol }) => (
          <span className="text-font-num-12 text-grey-1">
            {balance}
            {symbol}
          </span>
        )}
      </InFiat>
    </div>
  );
});
