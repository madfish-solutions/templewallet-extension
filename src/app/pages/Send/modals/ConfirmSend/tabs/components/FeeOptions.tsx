import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import Money from 'app/atoms/Money';
import FastIconSrc from 'app/icons/fee-options/fast.svg?url';
import MiddleIconSrc from 'app/icons/fee-options/middle.svg?url';
import SlowIconSrc from 'app/icons/fee-options/slow.svg?url';
import InFiat from 'app/templates/InFiat';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { getAssetSymbol } from 'lib/metadata';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

export type OptionLabel = 'slow' | 'mid' | 'fast';

interface Option {
  label: OptionLabel;
  iconSrc: string;
  textColorClassName: string;
}

const options: Option[] = [
  { label: 'slow', iconSrc: SlowIconSrc, textColorClassName: 'text-error' },
  { label: 'mid', iconSrc: MiddleIconSrc, textColorClassName: 'text-warning' },
  { label: 'fast', iconSrc: FastIconSrc, textColorClassName: 'text-success' }
];

interface FeeOptionsProps {
  chainAssetSlug: string;
  activeOptionName: OptionLabel;
  estimatedFeeOptions: { slow: string; mid: string; fast: string };
  onOptionClick?: (option: OptionLabel) => void;
}

export const FeeOptions: FC<FeeOptionsProps> = ({
  chainAssetSlug,
  activeOptionName,
  estimatedFeeOptions,
  onOptionClick
}) => {
  const [chainKind, chainId, assetSlug] = useMemo(() => parseChainAssetSlug(chainAssetSlug), [chainAssetSlug]);

  const isEvm = chainKind === TempleChainKind.EVM;

  return (
    <div className="flex flex-row gap-x-2">
      {options.map(option => (
        <Option
          key={option.label}
          isEvm={isEvm}
          chainId={chainId}
          assetSlug={assetSlug}
          option={option}
          amount={estimatedFeeOptions[option.label]}
          active={activeOptionName === option.label}
          onClick={() => onOptionClick?.(option.label)}
        />
      ))}
    </div>
  );
};

interface OptionProps {
  isEvm: boolean;
  chainId: number | string;
  assetSlug: string;
  active: boolean;
  option: Option;
  amount: string;
  onClick?: EmptyFn;
}

const Option: FC<OptionProps> = ({ isEvm, chainId, assetSlug, active, option, amount, onClick }) => {
  const network = useEvmChainByChainId(chainId as number)!;

  const nativeAssetSymbol = useMemo(() => getAssetSymbol(network?.currency), [network]);

  return (
    <div
      className={clsx(
        'flex flex-col flex-1 justify-center cursor-pointer',
        'items-center shadow-bottom p-2 gap-y-1 rounded-lg border-1.5',
        active ? 'border-primary' : 'border-transparent'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col text-center">
        <img src={option.iconSrc} alt={option.label} className="my-1.5" />
        <span className={clsx('text-font-description-bold', option.textColorClassName)}>
          {option.label.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col text-center">
        <InFiat
          chainId={chainId}
          assetSlug={assetSlug}
          volume={amount}
          smallFractionFont={false}
          roundingMode={BigNumber.ROUND_FLOOR}
          evm={isEvm}
        >
          {({ balance, symbol }) => (
            <span className="text-font-num-bold-12">
              {symbol}
              {balance}
            </span>
          )}
        </InFiat>
        <span className="text-font-description text-grey-2">
          <Money
            cryptoDecimals={nativeAssetSymbol.length > 4 ? 5 : 6}
            smallFractionFont={false}
            tooltipPlacement="bottom"
          >
            {amount}
          </Money>{' '}
          {nativeAssetSymbol}
        </span>
      </div>
    </div>
  );
};
