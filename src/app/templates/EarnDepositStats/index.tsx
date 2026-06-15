import React, { FC, useMemo } from 'react';

import clsx from 'clsx';

import { useEthDepositChangeChart } from 'app/hooks/deposits/use-eth-deposit-change-chart';
import { useTezosDepositChangeChart } from 'app/hooks/deposits/use-tezos-deposit-change-chart';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TEZ_TOKEN_SLUG, EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID, TempleAccountType } from 'lib/temple/types';
import { checkDeposit, mergeDepositSeries } from 'lib/utils/deposits';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { EvmAssetIcon, TezosAssetIcon } from '../AssetIcon';

import { EarnDepositStatsLayout } from './components/EarnDepositStatsLayout';

const DEFAULT_DEPOSIT_ICON_CLASSNAMES = 'p-0.5 border border-lines bg-white rounded-full';

export const EarnDepositStats = () => {
  const tezosPkh = useAccountAddressForTezos();
  const evmPkh = useAccountAddressForEvm();

  const isTestnetMode = useTestnetModeEnabledSelector();
  const account = useAccount();

  if (isTestnetMode || account.type === TempleAccountType.WatchOnly) {
    return null;
  }

  if (tezosPkh && evmPkh) {
    return <CombinedEarnDepositStats tezosAccountPkh={tezosPkh} evmAccountPkh={evmPkh} />;
  }

  if (tezosPkh) {
    return <TezosEarnDepositStats tezosAccountPkh={tezosPkh} />;
  }

  if (evmPkh) {
    return <EvmEarnDepositStats evmAccountPkh={evmPkh} />;
  }

  return null;
};

interface TezosEarnDepositStatsProps {
  tezosAccountPkh: string;
}

interface EvmEarnDepositStatsProps {
  evmAccountPkh: HexString;
}

interface CombinedEarnDepositStatsProps {
  tezosAccountPkh: string;
  evmAccountPkh: HexString;
}

const CombinedEarnDepositStats: FC<CombinedEarnDepositStatsProps> = ({ tezosAccountPkh, evmAccountPkh }) => {
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

  if (isChartError) return null;

  return (
    <EarnDepositStatsLayout
      chartData={chartData}
      isChartLoading={isChartLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={
        <div className="flex items-center">
          {hasTezDeposit && (
            <TezosAssetIcon
              size={16}
              assetSlug={TEZ_TOKEN_SLUG}
              tezosChainId={TEZOS_MAINNET_CHAIN_ID}
              className={DEFAULT_DEPOSIT_ICON_CLASSNAMES}
            />
          )}
          {hasEthDeposit && (
            <EvmAssetIcon
              size={16}
              assetSlug={EVM_TOKEN_SLUG}
              evmChainId={ETHEREUM_MAINNET_CHAIN_ID}
              className={clsx(DEFAULT_DEPOSIT_ICON_CLASSNAMES, hasTezDeposit && '-ml-1')}
            />
          )}
        </div>
      }
    />
  );
};

const TezosEarnDepositStats: FC<TezosEarnDepositStatsProps> = ({ tezosAccountPkh }) => {
  const {
    data: tezosChartData,
    selectedFiatCurrency,
    isLoading,
    isError
  } = useTezosDepositChangeChart(tezosAccountPkh);

  if (isError) return null;

  return (
    <EarnDepositStatsLayout
      chartData={tezosChartData}
      isChartLoading={isLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={
        <TezosAssetIcon
          size={16}
          assetSlug={TEZ_TOKEN_SLUG}
          tezosChainId={TEZOS_MAINNET_CHAIN_ID}
          className={DEFAULT_DEPOSIT_ICON_CLASSNAMES}
        />
      }
    />
  );
};

const EvmEarnDepositStats: FC<EvmEarnDepositStatsProps> = ({ evmAccountPkh }) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const { data: ethChartData, isLoading, isError } = useEthDepositChangeChart(evmAccountPkh);

  if (isError) return null;

  return (
    <EarnDepositStatsLayout
      chartData={ethChartData}
      isChartLoading={isLoading}
      fiatCurrencySymbol={selectedFiatCurrency.symbol}
      headerIcons={
        <EvmAssetIcon
          size={16}
          assetSlug={EVM_TOKEN_SLUG}
          evmChainId={ETHEREUM_MAINNET_CHAIN_ID}
          className={DEFAULT_DEPOSIT_ICON_CLASSNAMES}
        />
      }
    />
  );
};
