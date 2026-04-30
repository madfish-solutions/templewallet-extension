import React, { ReactNode, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import InFiat from 'app/templates/InFiat';
import { CrossChainAsset } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

import { CrossChainAssetIcon } from './CrossChainAssetIcon';

interface Props {
  asset: CrossChainAsset;
  amount: string;
  sign?: '-' | '+';
  amountClassName?: string;
  rightContent?: ReactNode;
}

export const CrossChainAmountRow = memo<Props>(({ asset, amount, sign, amountClassName, rightContent }) => {
  const bnAmount = useMemo(() => (amount ? new BigNumber(amount) : new BigNumber(0)), [amount]);
  const hasTempleAsset = Boolean(asset.chainId && asset.assetSlug);
  const isEvm = asset.chainKind === TempleChainKind.EVM;

  const fiatRight =
    hasTempleAsset && rightContent === undefined ? (
      <InFiat
        assetSlug={asset.assetSlug!}
        chainId={asset.chainId!}
        volume={bnAmount}
        evm={isEvm}
        smallFractionFont={false}
      >
        {({ balance, symbol, noPrice }) =>
          noPrice ? (
            <span className="text-font-description text-grey-1">—</span>
          ) : (
            <span className="text-font-description text-grey-1">
              {balance} {symbol}
            </span>
          )
        }
      </InFiat>
    ) : null;

  return (
    <div className="flex items-center gap-x-2">
      <CrossChainAssetIcon asset={asset} size={32} />
      <div className={clsx('flex-1 min-w-0 flex items-baseline gap-x-1 text-font-num-bold-16', amountClassName)}>
        <div>
          {sign && <span>{sign}</span>}
          <Money smallFractionFont={false} tooltipPlacement="bottom">
            {bnAmount}
          </Money>
        </div>
        <span className="truncate">{asset.symbol}</span>
      </div>
      {rightContent ?? fiatRight}
    </div>
  );
});
