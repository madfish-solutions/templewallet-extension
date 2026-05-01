import React, { ReactNode } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import InFiat from 'app/templates/InFiat';
import { CrossChainAsset } from 'lib/cross-chain';
import { useFiatCurrency } from 'lib/fiat-currency';
import { TempleChainKind } from 'temple/types';

import { useExternalCoinPrice } from '../hooks/use-external-coin-price';

import { CrossChainAssetIcon } from './CrossChainAssetIcon';

interface Props {
  asset: CrossChainAsset;
  amount: string;
  sign?: '-' | '+';
  amountClassName?: string;
  rightContent?: ReactNode;
}

export const CrossChainAmountRow = ({ asset, amount, sign, amountClassName, rightContent }: Props) => {
  const bnAmount = amount ? new BigNumber(amount) : new BigNumber(0);
  const hasTempleAsset = Boolean(asset.chainId && asset.assetSlug);
  const isEvm = asset.chainKind === TempleChainKind.EVM;

  const fiatRight =
    rightContent !== undefined ? null : hasTempleAsset ? (
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
    ) : (
      <ExternalFiatAmount asset={asset} amount={bnAmount} />
    );

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
};

const ExternalFiatAmount = ({ asset, amount }: { asset: CrossChainAsset; amount: BigNumber }) => {
  const price = useExternalCoinPrice(asset.exolixCoin);
  const { selectedFiatCurrency } = useFiatCurrency();

  if (price.isZero()) return <span className="text-font-description text-grey-1">—</span>;

  return (
    <span className="text-font-description text-grey-1">
      <Money fiat smallFractionFont={false}>
        {amount.times(price)}
      </Money>{' '}
      {selectedFiatCurrency.symbol}
    </span>
  );
};
