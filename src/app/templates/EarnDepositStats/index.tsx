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
import { T } from 'lib/i18n';
import { useDelegate } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';

interface ActiveDepositValue {
  amount?: BigNumber;
  isLoading: boolean;
}

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
  const tezosChain = useTezosMainnetChain();

  const { value: tezBalance } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, tezosChain);
  const { data: myBakerPkh, isLoading: isBakerAddressLoading } = useDelegate(accountPkh, tezosChain, false, true);
  const { data: stakedAtomic, isLoading: isStakedAmountLoading } = useStakedAmount(tezosChain, accountPkh, false);

  const {
    data: chartData,
    selectedFiatCurrency,
    changePercent,
    isLoading: isChartLoading,
    isError: isChartError
  } = useTezosDepositChangeChartData();

  console.log({ isChartError });

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

  if (deposit.isLoading || isChartLoading) return <Loader size="S" trackVariant="dark" className="text-secondary" />;

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
