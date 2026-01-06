import React, { FC, memo, useMemo } from 'react';

import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { EarnDepositStatsLayout } from './components/EarnDepositStatsLayout';
import { useEthDepositChangeChart } from './hooks/use-eth-deposit-change-chart';
import { useTezosDepositChangeChart } from './hooks/use-tezos-deposit-change-chart';
import { EarnDepositStatsProps } from './types';
import { checkDeposit, mergeDepositSeries } from './utils';

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

  const hasTezDeposit = useMemo(() => checkDeposit(tezosChartData), [tezosChartData]);
  const hasEthDeposit = useMemo(() => checkDeposit(ethChartData), [ethChartData]);

  const chartData = useMemo(() => mergeDepositSeries(tezosChartData, ethChartData), [tezosChartData, ethChartData]);

  const isChartError = isTezosChartError || isEthChartError;
  const isChartLoading = isTezosChartLoading || isEthChartLoading;
  const shouldForceNoDeposits = isGloballyDisabled || isChartError;

  if (!isHomePage && shouldForceNoDeposits) return null;

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
          {hasTezDeposit && (
            <TezosNetworkLogo
              size={16}
              chainId={TEZOS_MAINNET_CHAIN_ID}
              className="border border-lines bg-white rounded-full"
            />
          )}
          {hasEthDeposit && (
            <EvmNetworkLogo
              size={16}
              chainId={ETHEREUM_MAINNET_CHAIN_ID}
              className={hasTezDeposit ? '-ml-1' : undefined}
              imgClassName="p-0.5"
            />
          )}
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

  const shouldForceNoDeposits = isGloballyDisabled || isError;

  if (!isHomePage && shouldForceNoDeposits) return null;

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

  const shouldForceNoDeposits = isGloballyDisabled || isError;

  if (!isHomePage && shouldForceNoDeposits) return null;

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
