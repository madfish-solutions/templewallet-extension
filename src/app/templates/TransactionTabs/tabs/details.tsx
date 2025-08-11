import React, { FC, ReactNode, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { IconBase } from 'app/atoms';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { ChartListItem } from 'app/templates/chart-list-item';
import InFiat from 'app/templates/InFiat';
import { t, T } from 'lib/i18n';
import { getAssetSymbol, useGetTezosGasMetadata } from 'lib/metadata';
import { TEMPLE_TOKEN } from 'lib/route3/constants';
import { EvmChain, OneOfChains } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface Props {
  network: OneOfChains;
  nativeAssetSlug: string;
  goToFeeTab: EmptyFn;
  displayedFee?: string;
  displayedStorageFee?: string;
  destinationName?: ReactNode;
  destinationValue?: ReactNode;
  cashbackInTkey?: string;
  minimumReceived?: {
    amount: string;
    symbol: string;
  };
  bridgeData?: {
    inputNetwork: EvmChain;
    outputNetwork: EvmChain;
    executionTime: string;
    protocolFee?: string;
    destinationChainGasTokenAmount?: BigNumber;
  };
}

export const DetailsTab: FC<Props> = ({
  network,
  nativeAssetSlug,
  destinationName,
  destinationValue,
  displayedFee,
  displayedStorageFee,
  cashbackInTkey,
  minimumReceived,
  goToFeeTab,
  bridgeData
}) => {
  const { kind: chainKind, chainId } = network;

  return (
    <FadeTransition>
      <div className="flex flex-col px-4 py-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
        {bridgeData ? (
          <>
            <ChartListItem title={<T id="networkFrom" />}>
              <div className="flex flex-row items-center">
                <span className="p-1 text-font-num-12">{bridgeData.inputNetwork.name}</span>
                <EvmNetworkLogo chainId={bridgeData.inputNetwork.chainId} size={16} />
              </div>
            </ChartListItem>
            <ChartListItem title={<T id="networkTo" />}>
              <div className="flex flex-row items-center">
                <span className="p-1 text-font-num-12">{bridgeData.outputNetwork.name}</span>
                <EvmNetworkLogo chainId={bridgeData?.outputNetwork.chainId} size={16} />
              </div>
            </ChartListItem>
          </>
        ) : (
          <ChartListItem title={<T id="network" />}>
            <div className="flex flex-row items-center">
              <span className="p-1 text-font-num-12">{network.name}</span>
              {chainKind === TempleChainKind.EVM ? (
                <EvmNetworkLogo chainId={chainId} size={16} />
              ) : (
                <TezosNetworkLogo chainId={chainId} size={16} />
              )}
            </div>
          </ChartListItem>
        )}

        {bridgeData?.executionTime && (
          <ChartListItem title={<T id="estimatedTime" />}>
            <span className="p-1 text-font-num-12">≈ {bridgeData.executionTime} </span>
          </ChartListItem>
        )}

        {bridgeData?.destinationChainGasTokenAmount && (
          <SwapInfoRow
            title={t('extraGas')}
            amount={bridgeData.destinationChainGasTokenAmount.toString()}
            symbol={bridgeData.outputNetwork.currency.name}
          />
        )}

        {(isDefined(destinationName) || isDefined(destinationValue)) && (
          <ChartListItem title={destinationName}>{destinationValue}</ChartListItem>
        )}

        {isDefined(minimumReceived) && <SwapInfoRow title={t('minimumReceived')} {...minimumReceived} />}

        {isDefined(cashbackInTkey) && (
          <SwapInfoRow title={t('swapCashback')} amount={cashbackInTkey} symbol={TEMPLE_TOKEN.symbol} />
        )}

        {bridgeData?.protocolFee && (
          <ChartListItem title={<T id="protocolFee" />}>
            <div className="flex flex-row items-center">
              <FeesInfo network={network} assetSlug={nativeAssetSlug} amount={bridgeData.protocolFee} />
            </div>
          </ChartListItem>
        )}

        <ChartListItem title={<T id="gasFee" />} bottomSeparator={Boolean(displayedStorageFee)}>
          <div className="flex flex-row items-center">
            <FeesInfo network={network} assetSlug={nativeAssetSlug} amount={displayedFee} goToFeeTab={goToFeeTab} />
          </div>
        </ChartListItem>

        {displayedStorageFee && (
          <ChartListItem title={<T id="storageFee" />} titleClassName="capitalize" bottomSeparator={false}>
            <div className="flex flex-row items-center">
              <FeesInfo
                network={network}
                assetSlug={nativeAssetSlug}
                amount={displayedStorageFee}
                goToFeeTab={goToFeeTab}
              />
            </div>
          </ChartListItem>
        )}
      </div>
    </FadeTransition>
  );
};

interface FeesInfoProps {
  network: OneOfChains;
  assetSlug: string;
  goToFeeTab?: EmptyFn;
  amount?: string;
}

const FeesInfo: FC<FeesInfoProps> = ({ network, assetSlug, amount = '0.00', goToFeeTab }) => {
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

interface SwapInfoRowProps {
  title: string;
  amount: string;
  symbol: string;
}

const SwapInfoRow: FC<SwapInfoRowProps> = ({ title, amount, symbol }) => (
  <ChartListItem title={title}>
    <span className="p-1 text-font-num-12">
      <Money smallFractionFont={false} tooltipPlacement="bottom">
        {amount}
      </Money>{' '}
      {symbol}
    </span>
  </ChartListItem>
);
