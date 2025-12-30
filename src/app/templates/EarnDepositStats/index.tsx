import React, { FC, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Loader } from 'app/atoms';
import Money from 'app/atoms/Money';
import { TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { useEthDepositChangeChart } from './hooks/use-eth-deposit-change-chart';
import { useTezosDepositChangeChart } from './hooks/use-tezos-deposit-change-chart';
import { mergeDepositSeries } from './utils';

export const EarnDepositStats = memo(() => {
  const tezosPkh = useAccountAddressForTezos();
  const evmPkh = useAccountAddressForEvm();

  if (tezosPkh) {
    return <EarnDepositStatsContent tezosAccountPkh={tezosPkh} evmAccountPkh={evmPkh} />;
  }

  return null;
});

interface EarnDepositStatsContentProps {
  tezosAccountPkh: string;
  evmAccountPkh?: string | null;
}

const EarnDepositStatsContent: FC<EarnDepositStatsContentProps> = ({ tezosAccountPkh, evmAccountPkh }) => {
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

  const changePercent = useMemo(() => {
    if (!chartData || !chartData.length) {
      return;
    }

    const [firstTimestamp, firstValue] = chartData[0];
    const [lastTimestamp, lastValue] = chartData[chartData.length - 1];

    if (firstTimestamp === lastTimestamp || firstValue <= 0) {
      return;
    }

    return ((lastValue - firstValue) / firstValue) * 100;
  }, [chartData]);

  const fiatChangeValues = useMemo(
    () =>
      chartData?.map(([timestamp, price]) => ({
        timestamp,
        value: price
      })) ?? [],
    [chartData]
  );

  const latestFiatValue = useMemo(
    () => (chartData && chartData.length ? chartData[chartData.length - 1][1] : undefined),
    [chartData]
  );

  const changePercentBn = useMemo(
    () => (typeof changePercent === 'number' ? new BigNumber(changePercent).decimalPlaces(2) : undefined),
    [changePercent]
  );

  const isChangePositive = changePercentBn && changePercentBn.gt(0);
  const isChangeNegative = changePercentBn && changePercentBn.lt(0);

  const isChartError = isTezosChartError || isEthChartError;
  const isChartLoading = isTezosChartLoading || isEthChartLoading;

  if (isChartError) return null;

  return (
    <div className="flex flex-col gap-y-2 p-4 rounded-8 bg-white border-0.5 border-lines">
      {isChartLoading ? (
        <div className="w-full h-[68px] flex justify-center items-center">
          <Loader size="M" trackVariant="dark" className="text-secondary" />
        </div>
      ) : (
        <>
          <div className="flex gap-x-1">
            <span className="text-font-description text-grey-1">
              <T id="yourDeposits" />
            </span>

            <TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} size={16} />
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-y-1">
              <span className="text-font-num-bold-16">
                <Money fiat shortened smallFractionFont={false}>
                  {latestFiatValue ?? ZERO}
                </Money>{' '}
                {selectedFiatCurrency.symbol}
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
};
