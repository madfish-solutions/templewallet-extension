import React, { FC, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Loader } from 'app/atoms';
import Money from 'app/atoms/Money';
import { TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { useTezosDepositChangeChartData } from 'app/hooks/use-tezos-deposit-change-chart-data';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForTezos } from 'temple/front';

export const EarnDepositStats = memo(() => {
  const accountPkh = useAccountAddressForTezos();

  if (!accountPkh) {
    return null;
  }

  return <EarnDepositStatsContent accountPkh={accountPkh} />;
});

interface EarnDepositStatsContentProps {
  accountPkh: string;
}

const EarnDepositStatsContent: FC<EarnDepositStatsContentProps> = ({ accountPkh }) => {
  const {
    data: chartData,
    selectedFiatCurrency,
    changePercent,
    isLoading: isChartLoading,
    isError: isChartError
  } = useTezosDepositChangeChartData(accountPkh);

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

  if (isChartError) return null;
  if (isChartLoading) return <Loader size="S" trackVariant="dark" className="text-secondary" />;

  return (
    <div className="flex flex-col gap-y-2 p-4 rounded-8 bg-white border-0.5 border-lines">
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
    </div>
  );
};
