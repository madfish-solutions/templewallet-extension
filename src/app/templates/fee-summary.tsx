import React, { FC, useCallback, useMemo } from 'react';

import Tippy from '@tippyjs/react';
import BigNumber from 'bignumber.js';

import { IconBase } from 'app/atoms';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import InFiat from 'app/templates/InFiat';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency/core';
import { T, t } from 'lib/i18n';
import { getAssetSymbol, useGetTezosGasMetadata } from 'lib/metadata';
import { OneOfChains } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface FeesInfoProps {
  network: OneOfChains;
  assetSlug: string;
  amount?: string;
  goToFeeTab?: EmptyFn;
}

const FeesInfo = ({ network, assetSlug, amount = '0.00', goToFeeTab }: FeesInfoProps) => {
  const isEvm = network.kind === TempleChainKind.EVM;
  const getTezosGasMetadata = useGetTezosGasMetadata();

  const nativeAssetSymbol = useMemo(
    () => getAssetSymbol(isEvm ? network.currency : getTezosGasMetadata(network.chainId)),
    [getTezosGasMetadata, isEvm, network]
  );

  return (
    <>
      <div className="p-1 text-font-num-12">
        <InFiat
          chainId={network.chainId}
          assetSlug={assetSlug}
          volume={amount}
          smallFractionFont={false}
          showLessThanSign={true}
          roundingMode={BigNumber.ROUND_FLOOR}
          evm={isEvm}
        >
          {({ balance, symbol, tooLowSign }) => (
            <span className="pr-1 border-r-1.5 border-lines">
              {tooLowSign && '< '}
              {symbol}
              {balance}
            </span>
          )}
        </InFiat>
        <span className="pl-1">
          <Money smallFractionFont={false} tooltipPlacement="bottom">
            {amount}
          </Money>{' '}
          {nativeAssetSymbol}
        </span>
      </div>
      {goToFeeTab && <IconBase Icon={ChevronRightIcon} className="text-primary cursor-pointer" onClick={goToFeeTab} />}
    </>
  );
};

const totalFeesInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  animation: 'shift-away-subtle',
  maxWidth: '32rem',
  placement: 'bottom' as const
} as const;

interface FeeSummaryProps {
  network: OneOfChains;
  assetSlug: string;
  gasFee?: string;
  storageFee?: string;
  protocolFee?: string;
  onOpenFeeTab?: EmptyFn;
  embedded?: boolean;
}

export const FeeSummary: FC<FeeSummaryProps> = ({
  network,
  assetSlug,
  gasFee,
  storageFee,
  protocolFee,
  onOpenFeeTab,
  embedded = false
}) => {
  const total = useMemo(() => {
    const values = [gasFee, storageFee, protocolFee].filter((value): value is string => Boolean(value));
    return values.reduce((acc, v) => acc.plus(v), new BigNumber(0));
  }, [gasFee, storageFee, protocolFee]);

  const getTezosGasMetadata = useGetTezosGasMetadata();
  const nativeSymbol = useMemo(() => {
    const isEvm = network.kind === TempleChainKind.EVM;
    return getAssetSymbol(isEvm ? network.currency : getTezosGasMetadata(network.chainId));
  }, [network, getTezosGasMetadata]);

  const evm = network.kind === TempleChainKind.EVM;
  const price = useAssetFiatCurrencyPrice(assetSlug, network.chainId, evm);
  const { selectedFiatCurrency } = useFiatCurrency();

  const toFiat = useCallback(
    (amount?: string) => {
      if (!amount) return '0';
      return new BigNumber(amount).times(price).toString();
    },
    [price]
  );

  const tooltipContent = (
    <div className="text-white">
      <div className="text-font-14 mb-2">{t('totalFeeAmount')}</div>
      {gasFee && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-font-14">{t('gasFee')}</div>
          <div className="text-right whitespace-nowrap">
            <span className="pr-1 border-r-1.5 border-grey-1">
              <Money fiat smallFractionFont={false}>
                {toFiat(gasFee)}
              </Money>{' '}
              {selectedFiatCurrency.symbol}
            </span>
            <span className="pl-1">
              <Money smallFractionFont={false}>{gasFee}</Money> {nativeSymbol}
            </span>
          </div>
        </div>
      )}
      {protocolFee && (
        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="text-font-14">
            <T id="protocolFee" />
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="pr-1 border-r-1.5 border-grey-1">
              <Money fiat smallFractionFont={false}>
                {toFiat(protocolFee)}
              </Money>{' '}
              {selectedFiatCurrency.symbol}
            </span>
            <span className="pl-1">
              <Money smallFractionFont={false}>{protocolFee}</Money> {nativeSymbol}
            </span>
          </div>
        </div>
      )}
      {storageFee && (
        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="text-font-14">
            <T id="storageFee" />
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="pr-1 border-r-1.5 border-grey-1">
              <Money fiat smallFractionFont={false}>
                {toFiat(storageFee)}
              </Money>{' '}
              {selectedFiatCurrency.symbol}
            </span>
            <span className="pl-1">
              <Money smallFractionFont={false}>{storageFee}</Money> {nativeSymbol}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const content = (
    <div className="flex flex-row items-center justify-between">
      <p className="p-1 text-grey-1 text-font-description-bold">{t('totalFee')}</p>

      <div className="flex flex-row items-center py-2">
        <Tippy {...totalFeesInfoTippyProps} content={tooltipContent}>
          <span className="flex items-center justify-center cursor-pointer">
            {network.kind === TempleChainKind.EVM ? (
              <EvmNetworkLogo chainId={network.chainId} size={16} />
            ) : (
              <TezosNetworkLogo chainId={network.chainId} size={16} />
            )}
          </span>
        </Tippy>
        <FeesInfo network={network} assetSlug={assetSlug} amount={total.toFixed()} goToFeeTab={onOpenFeeTab} />
      </div>
    </div>
  );

  if (embedded) return content;

  return <div className="flex flex-col px-4 py-2 rounded-lg shadow-bottom bg-white">{content}</div>;
};
