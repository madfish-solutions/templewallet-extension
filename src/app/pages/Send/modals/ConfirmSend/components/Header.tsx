import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { EvmTokenIconWithNetwork, TezosTokenIconWithNetwork } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { TempleChainKind } from 'temple/types';

interface HeaderProps {
  chainAssetSlug: string;
  amount: string;
}

export const Header: FC<HeaderProps> = ({ chainAssetSlug, amount }) => {
  const [chainKind, chainId, assetSlug] = useMemo(() => parseChainAssetSlug(chainAssetSlug), [chainAssetSlug]);

  const isEvm = chainKind === TempleChainKind.EVM;

  return (
    <div className="flex flex-col justify-center items-center text-center my-4">
      {isEvm ? (
        <EvmTokenIconWithNetwork evmChainId={chainId} assetSlug={assetSlug} />
      ) : (
        <TezosTokenIconWithNetwork tezosChainId={chainId} assetSlug={assetSlug} />
      )}

      <span className="text-font-num-bold-14 mt-2">{amount}</span>
      <InFiat
        chainId={chainId}
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
};
