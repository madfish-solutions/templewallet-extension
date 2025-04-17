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
import { T } from 'lib/i18n';
import { getAssetSymbol, getTezosGasMetadata } from 'lib/metadata';
import { OneOfChains } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

interface Props {
  network: OneOfChains;
  assetSlug: string;
  goToFeeTab: EmptyFn;
  displayedFee?: string;
  displayedStorageFee?: string;
  destinationName: ReactNode;
  destinationValue: ReactNode;
}

export const DetailsTab: FC<Props> = ({
  network,
  assetSlug,
  destinationName,
  destinationValue,
  displayedFee,
  displayedStorageFee,
  goToFeeTab
}) => {
  const { kind: chainKind, chainId } = network;

  return (
    <FadeTransition>
      <div className="flex flex-col px-4 py-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
        <ChartListItem title={<T id="network" />}>
          <div className="flex flex-row items-center">
            <span className="p-1 text-font-description-bold">{network.name}</span>
            {chainKind === TempleChainKind.EVM ? (
              <EvmNetworkLogo chainId={chainId} />
            ) : (
              <TezosNetworkLogo chainId={chainId} />
            )}
          </div>
        </ChartListItem>

        {(isDefined(destinationName) || isDefined(destinationValue)) && (
          <ChartListItem title={destinationName}>{destinationValue}</ChartListItem>
        )}

        <ChartListItem title={<T id="gasFee" />} bottomSeparator={Boolean(displayedStorageFee)}>
          <div className="flex flex-row items-center">
            <FeesInfo network={network} assetSlug={assetSlug} amount={displayedFee} goToFeeTab={goToFeeTab} />
          </div>
        </ChartListItem>

        {displayedStorageFee && (
          <ChartListItem title={<T id="storageFee" />} titleClassName="capitalize" bottomSeparator={false}>
            <div className="flex flex-row items-center">
              <FeesInfo network={network} assetSlug={assetSlug} amount={displayedStorageFee} goToFeeTab={goToFeeTab} />
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
  goToFeeTab: EmptyFn;
  amount?: string;
}

const FeesInfo: FC<FeesInfoProps> = ({ network, assetSlug, amount = '0.00', goToFeeTab }) => {
  const isEvm = network.kind === TempleChainKind.EVM;

  const nativeAssetSymbol = useMemo(
    () => getAssetSymbol(isEvm ? network.currency : getTezosGasMetadata(network.chainId)),
    [isEvm, network]
  );

  return (
    <>
      <div className="p-1 text-font-num-bold-12">
        <InFiat
          chainId={network.chainId}
          assetSlug={assetSlug}
          volume={amount}
          smallFractionFont={false}
          roundingMode={BigNumber.ROUND_FLOOR}
          evm={isEvm}
        >
          {({ balance, symbol }) => (
            <span className="pr-1 border-r-1.5 border-lines">
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
      <IconBase Icon={ChevronRightIcon} className="text-primary cursor-pointer" onClick={goToFeeTab} />
    </>
  );
};
