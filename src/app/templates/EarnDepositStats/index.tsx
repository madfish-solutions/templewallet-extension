import React, { FC, memo, ReactNode, useMemo } from 'react';

import clsx from 'clsx';

import { Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import Money from 'app/atoms/Money';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { EvmAssetIconWithNetwork, TezosAssetIconWithNetwork } from 'app/templates/AssetIcon';
import { KoloCryptoCardPreview } from 'app/templates/KoloCard/KoloCryptoCardPreview';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHEREUM_APR, TEZOS_APY } from 'lib/constants';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { T } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { useDepositChartDerivedValues } from './hooks/use-deposit-chart-derived-values';
import { useEthDepositChangeChart } from './hooks/use-eth-deposit-change-chart';
import { useTezosDepositChangeChart } from './hooks/use-tezos-deposit-change-chart';
import { mergeDepositSeries } from './utils';

interface EarnDepositStatsProps {
  isHomePage?: boolean;
  onCryptoCardClick?: EmptyFn;
  containerClassName?: string;
}

export const EarnDepositStats = memo<EarnDepositStatsProps>(props => {
  const tezosPkh = useAccountAddressForTezos();
  const evmPkh = useAccountAddressForEvm();

  const isTestnetMode = useTestnetModeEnabledSelector();
  const account = useAccount();
  const isWatchOnly = account.type === TempleAccountType.WatchOnly;
  const isGloballyDisabled = isTestnetMode || isWatchOnly;

  if (!props.isHomePage && isGloballyDisabled) {
    return null;
  }

  const commonProps = { ...props, isGloballyDisabled };

  if (tezosPkh && evmPkh) {
    return <CombinedEarnDepositStats {...commonProps} tezosAccountPkh={tezosPkh} evmAccountPkh={evmPkh} />;
  }

  if (tezosPkh) {
    return <TezosEarnDepositStats {...commonProps} tezosAccountPkh={tezosPkh} />;
  }

  if (evmPkh) {
    return <EvmEarnDepositStats {...commonProps} evmAccountPkh={evmPkh} />;
  }

  return null;
});

interface CommonProps extends EarnDepositStatsProps {
  isGloballyDisabled?: boolean;
}

interface TezosEarnDepositStatsProps extends CommonProps {
  tezosAccountPkh: string;
}

interface EvmEarnDepositStatsProps extends CommonProps {
  evmAccountPkh: HexString;
}

interface CombinedEarnDepositStatsProps extends CommonProps {
  tezosAccountPkh: string;
  evmAccountPkh: HexString;
}

const CombinedEarnDepositStats: FC<CombinedEarnDepositStatsProps> = ({
  isHomePage,
  onCryptoCardClick,
  containerClassName,
  isGloballyDisabled,
  tezosAccountPkh,
  evmAccountPkh
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

  if (!isHomePage && (isGloballyDisabled || isChartError)) return null;

  const shouldForceNoDeposits = isGloballyDisabled || isChartError;

  return (
    <EarnDepositStatsLayout
      isHomePage={isHomePage}
      onCryptoCardClick={onCryptoCardClick}
      containerClassName={containerClassName}
      chartData={shouldForceNoDeposits ? undefined : chartData}
      isChartLoading={shouldForceNoDeposits ? false : isChartLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={
        <div className="flex items-center">
          <TezosNetworkLogo
            size={16}
            chainId={TEZOS_MAINNET_CHAIN_ID}
            className="border border-lines bg-white rounded-full"
          />
          <EvmNetworkLogo size={16} chainId={ETHEREUM_MAINNET_CHAIN_ID} className="-ml-1" imgClassName="p-0.5" />
        </div>
      }
    />
  );
};

const TezosEarnDepositStats: FC<TezosEarnDepositStatsProps> = ({
  isHomePage,
  onCryptoCardClick,
  containerClassName,
  isGloballyDisabled,
  tezosAccountPkh
}) => {
  const {
    data: tezosChartData,
    selectedFiatCurrency,
    isLoading,
    isError
  } = useTezosDepositChangeChart(tezosAccountPkh);

  if (!isHomePage && (isGloballyDisabled || isError)) return null;

  const shouldForceNoDeposits = isGloballyDisabled || isError;

  return (
    <EarnDepositStatsLayout
      isHomePage={isHomePage}
      onCryptoCardClick={onCryptoCardClick}
      containerClassName={containerClassName}
      chartData={shouldForceNoDeposits ? undefined : tezosChartData}
      isChartLoading={shouldForceNoDeposits ? false : isLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={<TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} size={16} />}
    />
  );
};

const EvmEarnDepositStats: FC<EvmEarnDepositStatsProps> = ({
  isHomePage,
  onCryptoCardClick,
  containerClassName,
  isGloballyDisabled,
  evmAccountPkh
}) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const { data: ethChartData, isLoading, isError } = useEthDepositChangeChart(evmAccountPkh);

  if (!isHomePage && (isGloballyDisabled || isError)) return null;

  const shouldForceNoDeposits = isGloballyDisabled || isError;

  return (
    <EarnDepositStatsLayout
      isHomePage={isHomePage}
      onCryptoCardClick={onCryptoCardClick}
      containerClassName={containerClassName}
      chartData={shouldForceNoDeposits ? undefined : ethChartData}
      isChartLoading={shouldForceNoDeposits ? false : isLoading}
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
  onCryptoCardClick,
  containerClassName,
  chartData,
  isChartLoading,
  fiatCurrencySymbol,
  headerIcons
}) => {
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  const { fiatChangeValues, latestFiatValue, changePercentBn, isChangePositive, isChangeNegative, hasDeposits } =
    useDepositChartDerivedValues(chartData);

  const statsCard = (
    <div
      className={clsx(
        'flex flex-col gap-y-2 p-4 rounded-8 border-0.5 border-lines bg-white',
        isHomePage && hasDeposits && !isChartLoading && 'hover:bg-grey-4'
      )}
    >
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

  if (!isHomePage && !isChartLoading && !hasDeposits) {
    return null;
  }

  if (!isHomePage) {
    return statsCard;
  }

  const linkContent =
    hasDeposits && !isChartLoading ? (
      statsCard
    ) : (
      <div className="flex flex-col rounded-8 pb-1 px-1 border-0.5 border-lines bg-white">
        <div className="flex items-center justify-between p-2 rounded-8 overflow-hidden">
          <span className="text-font-description-bold p-1">
            <T id="earn" />
          </span>
          <AnimatedMenuChevron ref={animatedChevronRef} />
        </div>

        <div className="rounded-8 p-3 pb-2 bg-background">
          {isChartLoading ? (
            <div className="flex py-1 justify-center items-center">
              <Loader size="L" trackVariant="dark" className="text-secondary" />
            </div>
          ) : (
            <HomeEarnNoDepositsContent />
          )}
        </div>
      </div>
    );

  return (
    <div className={clsx('flex flex-col relative pb-[68px]', containerClassName)}>
      <KoloCryptoCardPreview onClick={onCryptoCardClick} />

      <Link
        to="/earn"
        className={clsx(
          'relative -mb-[68px] px-4 transform transition-transform duration-200 ease-out',
          hasDeposits && 'peer-hover:translate-y-2'
        )}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        testID={HomeSelectors.earnSectionCard}
      >
        {linkContent}
      </Link>
    </div>
  );
};

const HomeEarnNoDepositsContent: FC = () => (
  <div className="flex flex-row gap-4 bg-background">
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
