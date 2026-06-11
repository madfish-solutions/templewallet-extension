import { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { Money } from 'app/atoms';
import { useDepositChartDerivedValues } from 'app/hooks/deposits/use-deposit-chart-derived-values';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { EvmAssetIcon, TezosAssetIcon } from 'app/templates/AssetIcon';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { FiatCurrencyOptionBase } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { checkDeposit, mergeDepositSeries } from 'lib/utils/deposits';

import { StatsCard } from '../stats-card';
import { StatsLoadingCard } from '../stats-loading-card';

import { EarnNoDepositsCard } from './earn-no-deposits-card';

interface EarnCardContentProps {
  tezosChartData: number[][] | undefined;
  ethChartData: number[][] | undefined;
  isChartLoading: boolean;
  isChartError: boolean;
  selectedFiatCurrency: FiatCurrencyOptionBase;
}

const DEFAULT_DEPOSIT_ICON_CLASSNAMES = 'border border-lines bg-white rounded-full';

export const EarnCardContent: FC<EarnCardContentProps> = ({
  tezosChartData,
  ethChartData,
  isChartLoading: syncIsChartLoading,
  isChartError,
  selectedFiatCurrency
}) => {
  const [isChartLoading] = useDebounce(syncIsChartLoading, 300);
  const isTestnetMode = useTestnetModeEnabledSelector();
  const chartData = mergeDepositSeries(tezosChartData, ethChartData);

  const hasTezDeposit = checkDeposit(tezosChartData);
  const hasEthDeposit = checkDeposit(ethChartData);
  const { fiatChangeValues, latestFiatValue, changePercentBn, isChangePositive, isChangeNegative, hasDeposits } =
    useDepositChartDerivedValues(chartData);

  if (!hasDeposits && !isChartLoading) {
    return <EarnNoDepositsCard />;
  }

  if (isChartLoading || !isDefined(latestFiatValue)) {
    return <StatsLoadingCard linkTo="/earn" />;
  }

  return (
    <StatsCard
      linkTo="/earn"
      title={
        <div className="flex items-center">
          <span className="mr-1">
            <T id="deposits" />
          </span>
          {hasTezDeposit && (
            <TezosAssetIcon
              size={16}
              assetSlug={TEZ_TOKEN_SLUG}
              tezosChainId={TEZOS_MAINNET_CHAIN_ID}
              className={clsx(DEFAULT_DEPOSIT_ICON_CLASSNAMES, 'p-0.5')}
            />
          )}
          {hasEthDeposit && (
            <EvmAssetIcon
              size={16}
              assetSlug={EVM_TOKEN_SLUG}
              evmChainId={ETHEREUM_MAINNET_CHAIN_ID}
              className={clsx(DEFAULT_DEPOSIT_ICON_CLASSNAMES, hasTezDeposit && '-ml-1.5')}
            />
          )}
        </div>
      }
      value={
        <span className="text-nowrap">
          <Money fiat smallFractionFont={false}>
            {latestFiatValue}
          </Money>{' '}
          {selectedFiatCurrency.symbol}
        </span>
      }
      change={
        changePercentBn && (
          <>
            <Money fiat={false} withSign smallFractionFont={false}>
              {changePercentBn}
            </Money>
            %
          </>
        )
      }
      isChangePositive={isChangePositive}
      isChangeNegative={isChangeNegative}
      chartData={isChartError || isTestnetMode ? undefined : fiatChangeValues}
    />
  );
};
