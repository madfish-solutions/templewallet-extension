import React, { FC, memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { Loader } from 'app/atoms';
import Money from 'app/atoms/Money';
import { TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { useTezosDepositChangeChartData } from 'app/hooks/use-tezos-deposit-change-chart-data';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { useDelegate } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';

interface ActiveDepositValue {
  amount?: BigNumber;
  isLoading: boolean;
}

export const EarnDepositStats: FC = memo(() => {
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
  const tezosChain = useTezosMainnetChain();

  const { value: tezBalance } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, tezosChain);
  const { data: myBakerPkh, isLoading: isBakerAddressLoading } = useDelegate(accountPkh, tezosChain, false, true);
  const { data: stakedAtomic, isLoading: isStakedAmountLoading } = useStakedAmount(tezosChain, accountPkh, false);

  const {
    data: chartData,
    changePercent,
    isLoading: isChartLoading,
    isError: isChartError
  } = useTezosDepositChangeChartData();

  const deposit = useMemo<ActiveDepositValue>(() => {
    if (isBakerAddressLoading || isStakedAmountLoading || !tezBalance) {
      return { isLoading: true };
    }

    const hasDelegation = Boolean(myBakerPkh) && tezBalance.gt(0);
    const hasStaked = stakedAtomic && !stakedAtomic.isNaN() && stakedAtomic.gt(0);

    if (!hasDelegation) {
      return { isLoading: false, amount: undefined };
    }

    let amount = tezBalance;
    if (hasStaked) {
      amount = tezBalance.plus(mutezToTz(stakedAtomic!));
    }

    return { amount, isLoading: false };
  }, [isBakerAddressLoading, isStakedAmountLoading, tezBalance, myBakerPkh, stakedAtomic]);

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

  return (
    <div className="mb-3 p-3 rounded-8 bg-white border-0.5 border-lines flex items-stretch gap-x-4">
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div className="flex items-center justify-between gap-x-2 mb-1">
          <div className="flex items-center gap-x-2 min-w-0">
            <span className="text-font-description-bold text-grey-1 truncate">Your deposits</span>

            <div className="flex items-center gap-x-1 shrink-0">
              <TezosNetworkLogo chainId={TEZOS_MAINNET_CHAIN_ID} size={20} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-1">
          <div className="flex items-baseline gap-x-1">
            {deposit.isLoading ? (
              <Loader size="S" trackVariant="dark" className="text-secondary" />
            ) : deposit.amount ? (
              <>
                <span className="text-font-num-bold-24">
                  <Money fiat smallFractionFont={false}>
                    {latestFiatValue ?? ZERO}
                  </Money>
                </span>
                <span className="text-font-description text-grey-1">$</span>
              </>
            ) : (
              <span className="text-font-description text-grey-3">No active deposits</span>
            )}
          </div>

          {isChartLoading || isChartError ? (
            <span className="text-font-description text-grey-3">{isChartLoading ? 'Loading' : 'No data'}</span>
          ) : changePercentBn ? (
            <span
              className={`text-font-num-12 ${
                isChangePositive ? 'text-success' : isChangeNegative ? 'text-error' : 'text-grey-1'
              }`}
            >
              <Money fiat={false} withSign smallFractionFont={false}>
                {changePercentBn}
              </Money>{' '}
              %
            </span>
          ) : null}
        </div>
      </div>

      <div className="w-44 flex items-end">
        <SimpleChart data={fiatChangeValues} />
      </div>
    </div>
  );
};
