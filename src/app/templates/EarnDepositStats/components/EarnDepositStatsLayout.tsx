import { FC } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Loader } from 'app/atoms';
import Money from 'app/atoms/Money';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { useDepositChartDerivedValues } from 'app/hooks/deposits/use-deposit-chart-derived-values';
import { T } from 'lib/i18n';
import { ZERO } from 'lib/utils/numbers';

interface EarnDepositStatsLayoutProps {
  chartData?: number[][];
  isChartLoading: boolean;
  fiatCurrencySymbol: string;
  headerIcons: React.ReactNode;
}

export const EarnDepositStatsLayout: FC<EarnDepositStatsLayoutProps> = ({
  chartData,
  isChartLoading: syncIsChartLoading,
  fiatCurrencySymbol,
  headerIcons
}) => {
  const [isChartLoading] = useDebounce(syncIsChartLoading, 300);

  const { fiatChangeValues, latestFiatValue, changePercentBn, isChangePositive, isChangeNegative, hasDeposits } =
    useDepositChartDerivedValues(chartData);

  const hasContentToShow = hasDeposits || isChartLoading;

  return hasContentToShow ? (
    <div className="flex flex-col gap-y-2 p-4 rounded-8 border-0.5 border-lines bg-white">
      {isChartLoading ? (
        <div className="flex justify-center items-center w-full h-15">
          <Loader size="L" trackVariant="dark" className="text-secondary" />
        </div>
      ) : (
        <FadeTransition>
          <div className="flex gap-x-1">
            <span className="text-font-description text-grey-1">
              <T id="yourDeposits" />
            </span>

            {headerIcons}
          </div>
          <div className="flex justify-between gap-x-8">
            <div className="flex flex-col gap-y-1">
              <span className="text-font-num-bold-16 text-nowrap">
                <Money fiat smallFractionFont={false}>
                  {latestFiatValue ?? ZERO}
                </Money>{' '}
                {fiatCurrencySymbol}
              </span>

              {changePercentBn && (
                <span
                  className={clsx(
                    'text-font-num-12',
                    isChangePositive ? 'text-success' : isChangeNegative ? 'text-error' : 'text-grey-1'
                  )}
                >
                  <Money fiat={false} withSign smallFractionFont={false}>
                    {changePercentBn}
                  </Money>
                  %
                </span>
              )}
            </div>

            <div className="w-full">
              <SimpleChart data={fiatChangeValues} />
            </div>
          </div>
        </FadeTransition>
      )}
    </div>
  ) : null;
};
