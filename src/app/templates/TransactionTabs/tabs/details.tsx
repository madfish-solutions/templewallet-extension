import React, { FC, ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { FadeTransition } from 'app/a11y/FadeTransition';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ChartListItem } from 'app/templates/chart-list-item';
import { t, T } from 'lib/i18n';
import { TEMPLE_TOKEN } from 'lib/route3/constants';
import { EvmChain, OneOfChains } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface Props {
  network: OneOfChains;
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
  destinationName,
  destinationValue,
  cashbackInTkey,
  minimumReceived,
  bridgeData
}) => {
  const { kind: chainKind, chainId } = network;

  return (
    <FadeTransition>
      <div className="flex flex-col px-4 py-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
        {(() => {
          const rows: React.ReactElement[] = [];

          if (bridgeData) {
            rows.push(
              <ChartListItem key="networkFrom" title={<T id="networkFrom" />}>
                <div className="flex flex-row items-center">
                  <span className="p-1 text-font-num-12">{bridgeData.inputNetwork.name}</span>
                  <EvmNetworkLogo chainId={bridgeData.inputNetwork.chainId} size={16} />
                </div>
              </ChartListItem>
            );
            rows.push(
              <ChartListItem key="networkTo" title={<T id="networkTo" />}>
                <div className="flex flex-row items-center">
                  <span className="p-1 text-font-num-12">{bridgeData.outputNetwork.name}</span>
                  <EvmNetworkLogo chainId={bridgeData?.outputNetwork.chainId} size={16} />
                </div>
              </ChartListItem>
            );
          } else {
            rows.push(
              <ChartListItem key="network" title={<T id="network" />}>
                <div className="flex flex-row items-center">
                  <span className="p-1 text-font-num-12">{network.name}</span>
                  {chainKind === TempleChainKind.EVM ? (
                    <EvmNetworkLogo chainId={chainId} size={16} />
                  ) : (
                    <TezosNetworkLogo chainId={chainId} size={16} />
                  )}
                </div>
              </ChartListItem>
            );
          }

          if (bridgeData?.executionTime) {
            rows.push(
              <ChartListItem key="estimatedTime" title={<T id="estimatedTime" />}>
                <span className="p-1 text-font-num-12">≈ {bridgeData.executionTime} </span>
              </ChartListItem>
            );
          }

          if (bridgeData?.destinationChainGasTokenAmount) {
            rows.push(
              <SwapInfoRow
                key="extraGas"
                title={t('extraGas')}
                amount={bridgeData.destinationChainGasTokenAmount.toString()}
                symbol={bridgeData.outputNetwork.currency.name}
              />
            );
          }

          if (isDefined(destinationName) || isDefined(destinationValue)) {
            rows.push(
              <ChartListItem key="destination" title={destinationName}>
                {destinationValue}
              </ChartListItem>
            );
          }

          if (isDefined(minimumReceived)) {
            rows.push(<SwapInfoRow key="minimumReceived" title={t('minimumReceived')} {...minimumReceived} />);
          }

          if (isDefined(cashbackInTkey)) {
            rows.push(
              <SwapInfoRow
                key="cashback"
                title={t('swapCashback')}
                amount={cashbackInTkey}
                symbol={TEMPLE_TOKEN.symbol}
              />
            );
          }

          return rows.map((row, index) => React.cloneElement(row, { bottomSeparator: index !== rows.length - 1 }));
        })()}
      </div>
    </FadeTransition>
  );
};

interface SwapInfoRowProps {
  title: string;
  amount: string;
  symbol: string;
  bottomSeparator?: boolean;
}

const SwapInfoRow: FC<SwapInfoRowProps> = ({ title, amount, symbol, bottomSeparator }) => (
  <ChartListItem title={title} bottomSeparator={bottomSeparator}>
    <span className="p-1 text-font-num-12">
      <Money smallFractionFont={false} tooltipPlacement="bottom">
        {amount}
      </Money>{' '}
      {symbol}
    </span>
  </ChartListItem>
);
