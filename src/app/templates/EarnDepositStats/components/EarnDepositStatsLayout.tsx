import React, { FC, memo } from 'react';

import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import Money from 'app/atoms/Money';
import { SimpleChart } from 'app/atoms/SimpleChart';
import { HomeSelectors } from 'app/pages/Home/selectors';
import { KoloCryptoCardPreview } from 'app/templates/KoloCard/KoloCryptoCardPreview';
import { T } from 'lib/i18n';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';

import { useDepositChartDerivedValues } from '../hooks/use-deposit-chart-derived-values';
import { EarnDepositStatsProps } from '../types';

import { HomeEarnNoDepositsContent } from './HomeEarnNoDepositsContent';

interface EarnDepositStatsLayoutProps extends EarnDepositStatsProps {
  chartData?: number[][];
  isChartLoading: boolean;
  fiatCurrencySymbol: string;
  headerIcons: React.ReactNode;
}

export const EarnDepositStatsLayout: FC<EarnDepositStatsLayoutProps> = ({
  isHomePage,
  onCryptoCardClick,
  containerClassName,
  chartData,
  isChartLoading: syncIsChartLoading,
  fiatCurrencySymbol,
  headerIcons
}) => {
  const [isChartLoading] = useDebounce(syncIsChartLoading, 300);

  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();

  const { fiatChangeValues, latestFiatValue, changePercentBn, isChangePositive, isChangeNegative, hasDeposits } =
    useDepositChartDerivedValues(chartData);

  const isHomeView = Boolean(isHomePage);
  const hasContentToShow = hasDeposits || isChartLoading;

  if (!isHomeView && !hasContentToShow) {
    return null;
  }

  const statsCard = (
    <div
      className={clsx(
        'flex flex-col gap-y-2 p-4 rounded-8 border-0.5 border-lines bg-white',
        isHomePage && hasDeposits && !isChartLoading && 'hover:bg-grey-4'
      )}
    >
      {isChartLoading ? (
        <LoaderLayout className="w-full h-[68px]" />
      ) : (
        <>
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
        </>
      )}
    </div>
  );

  if (!isHomeView) {
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
          {isChartLoading ? <LoaderLayout className="py-1" /> : <HomeEarnNoDepositsContent />}
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
          hasDeposits && '[&_*]:cursor-pointer peer-hover:translate-y-2'
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

const LoaderLayout = memo<{ className: string }>(({ className }) => (
  <div className={clsx('flex justify-center items-center', className)}>
    <Loader size="L" trackVariant="dark" className="text-secondary" />
  </div>
));
