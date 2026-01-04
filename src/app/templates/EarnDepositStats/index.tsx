import React, { FC, memo, ReactNode, RefObject, useMemo } from 'react';

import { Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR, TEZOS_APY } from 'lib/constants';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { T } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { useDepositChartDerivedValues } from './hooks/use-deposit-chart-derived-values';
import { useEthDepositChangeChart } from './hooks/use-eth-deposit-change-chart';
import { useTezosDepositChangeChart } from './hooks/use-tezos-deposit-change-chart';
import { mergeDepositSeries } from './utils';

interface EarnDepositStatsProps {
  isHomePage?: boolean;
  animatedChevronRef?: RefObject<AnimatedMenuChevron>;
}

export const EarnDepositStats = memo<EarnDepositStatsProps>(({ isHomePage, animatedChevronRef }) => {
  const tezosPkh = useAccountAddressForTezos();
  const evmPkh = useAccountAddressForEvm();

  if (tezosPkh && evmPkh) {
    return (
      <CombinedEarnDepositStats
        isHomePage={isHomePage}
        tezosAccountPkh={tezosPkh}
        evmAccountPkh={evmPkh}
        animatedChevronRef={animatedChevronRef}
      />
    );
  }

  if (tezosPkh) {
    return (
      <TezosEarnDepositStats
        isHomePage={isHomePage}
        tezosAccountPkh={tezosPkh}
        animatedChevronRef={animatedChevronRef}
      />
    );
  }

  if (evmPkh) {
    return (
      <EvmEarnDepositStats isHomePage={isHomePage} evmAccountPkh={evmPkh} animatedChevronRef={animatedChevronRef} />
    );
  }

  return null;
});

interface TezosEarnDepositStatsProps extends EarnDepositStatsProps {
  tezosAccountPkh: string;
}

interface EvmEarnDepositStatsProps extends EarnDepositStatsProps {
  evmAccountPkh: string;
}

interface CombinedEarnDepositStatsProps extends EarnDepositStatsProps {
  tezosAccountPkh: string;
  evmAccountPkh: string;
}

const CombinedEarnDepositStats: FC<CombinedEarnDepositStatsProps> = ({
  isHomePage,
  tezosAccountPkh,
  evmAccountPkh,
  animatedChevronRef
}) => {
  const {
    data: tezosChartData,
    selectedFiatCurrency,
    isLoading: isTezosChartLoading,
    isError: isTezosChartError
  } = useTezosDepositChangeChart(tezosAccountPkh);

  const {
    data: ethChartData,
    isLoading: isEthChartLoading,
    isError: isEthChartError
  } = useEthDepositChangeChart(evmAccountPkh);

  const chartData = useMemo(() => mergeDepositSeries(tezosChartData, ethChartData), [tezosChartData, ethChartData]);

  const isChartError = isTezosChartError || isEthChartError;
  const isChartLoading = isTezosChartLoading || isEthChartLoading;

  if (isChartError) return null;

  return (
    <EarnDepositStatsLayout
      isHomePage={isHomePage}
      animatedChevronRef={animatedChevronRef}
      chartData={chartData}
      isChartLoading={isChartLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={
        <div className="flex items-center gap-x-1">
          <TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} size={16} />
          <EvmNetworkLogo chainId={ETHEREUM_MAINNET_CHAIN_ID} size={16} imgClassName="p-0.5" />
        </div>
      }
    />
  );
};

const TezosEarnDepositStats: FC<TezosEarnDepositStatsProps> = ({ isHomePage, tezosAccountPkh, animatedChevronRef }) => {
  const {
    data: tezosChartData,
    selectedFiatCurrency,
    isLoading,
    isError
  } = useTezosDepositChangeChart(tezosAccountPkh);

  if (isError) return null;

  return (
    <EarnDepositStatsLayout
      isHomePage={isHomePage}
      animatedChevronRef={animatedChevronRef}
      chartData={tezosChartData}
      isChartLoading={isLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={<TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} size={16} />}
    />
  );
};

const EvmEarnDepositStats: FC<EvmEarnDepositStatsProps> = ({ isHomePage, evmAccountPkh, animatedChevronRef }) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const { data: ethChartData, isLoading, isError } = useEthDepositChangeChart(evmAccountPkh);

  if (isError) return null;

  return (
    <EarnDepositStatsLayout
      isHomePage={isHomePage}
      animatedChevronRef={animatedChevronRef}
      chartData={ethChartData}
      isChartLoading={isLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={<EvmNetworkLogo chainId={ETHEREUM_MAINNET_CHAIN_ID} size={16} imgClassName="p-0.5" />}
    />
  );
};

interface EarnDepositStatsLayoutProps extends EarnDepositStatsProps {
  chartData?: number[][];
  isChartLoading: boolean;
  fiatCurrencySymbol: string;
  headerIcons: ReactNode;
}

const EarnDepositStatsLayout: FC<EarnDepositStatsLayoutProps> = ({
  isHomePage,
  animatedChevronRef,
  chartData,
  isChartLoading,
  fiatCurrencySymbol,
  headerIcons
}) => {
  const { fiatChangeValues, latestFiatValue, changePercentBn, isChangePositive, isChangeNegative, hasDeposits } =
    useDepositChartDerivedValues(chartData);

  if (!isHomePage || (hasDeposits && !isChartLoading)) {
    return (
      <div className="flex flex-col gap-y-2 p-4 rounded-8 bg-white border-0.5 border-lines">
        {isChartLoading ? (
          <div className="w-full h-[68px] flex justify-center items-center">
            <Loader size="L" trackVariant="dark" className="text-secondary" />
          </div>
        ) : (
          <>
            <div className="flex gap-x-1">
              <span className="text-font-description text-grey-1">
                <T id="yourDeposits" />
              </span>

              {headerIcons}
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col gap-y-1">
                <span className="text-font-num-bold-16">
                  <Money fiat shortened smallFractionFont={false}>
                    {latestFiatValue ?? ZERO}
                  </Money>{' '}
                  {fiatCurrencySymbol}
                </span>

                {changePercentBn && (
                  <span
                    className={`text-font-num-12 ${
                      isChangePositive ? 'text-success' : isChangeNegative ? 'text-error' : 'text-grey-1'
                    }`}
                  >
                    <Money fiat={false} withSign smallFractionFont={false}>
                      {changePercentBn}
                    </Money>
                    %
                  </span>
                )}
              </div>

              <div className="w-52">
                <SimpleChart data={fiatChangeValues} />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  const innerContent = isChartLoading ? (
    <div className="flex py-1 justify-center items-center">
      <Loader size="L" trackVariant="dark" className="text-secondary" />
    </div>
  ) : (
    <HomeEarnNoDepositsContent />
  );

  return (
    <div className="flex flex-col rounded-8 pb-1 px-1 border-0.5 border-lines bg-white">
      <div className="flex items-center justify-between p-2 rounded-8 overflow-hidden">
        <span className="text-font-description-bold p-1">
          <T id="earn" />
        </span>
        {animatedChevronRef && <AnimatedMenuChevron ref={animatedChevronRef} />}
      </div>

      <div className="rounded-8 p-3 pb-2 bg-background">{innerContent}</div>
    </div>
  );
};

const HomeEarnNoDepositsContent: FC = () => (
  <div className="flex flex-row rounded-8 p-3 pb-2 gap-4 bg-background">
    <EarnOpportunityItem
      Icon={<EvmAssetIconWithNetwork assetSlug={EVM_TOKEN_SLUG} evmChainId={ETHEREUM_MAINNET_CHAIN_ID} size={24} />}
      symbol="ETH"
      displayRate={`${ETHEREUM_APR}% APR`}
    />
    <EarnOpportunityItem
      Icon={<TezosAssetIconWithNetwork assetSlug={TEZ_TOKEN_SLUG} tezosChainId={TEZOS_MAINNET_CHAIN_ID} size={24} />}
      symbol="TEZ"
      displayRate={`${TEZOS_APY}% APY`}
    />
  </div>
);

interface EarnOpportunityItemProps {
  Icon?: ReactNode;
  symbol: string;
  displayRate: string;
}

const EarnOpportunityItem: FC<EarnOpportunityItemProps> = ({ Icon, symbol, displayRate }) => (
  <div className="flex items-center justify-center gap-2 px-2">
    {Icon}

    <div className="flex items-center gap-1 whitespace-nowrap">
      <span className="text-font-description-bold">{symbol}</span>
      <span className="text-font-num-12 text-grey-1">{displayRate}</span>
    </div>
  </div>
);
