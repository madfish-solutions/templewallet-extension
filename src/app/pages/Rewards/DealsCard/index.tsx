import { FC } from 'react';

import { DealsBalances, DealsEmptyState, DealsLoadingState } from './balances';
import { DealsPromoBanner } from './promo-banner';
import { useDealsStats } from './use-deals-stats';

export const DealsCard: FC = () => {
  const { renderState, allTime, lastPayoutAmount, pending, lastPendingAmount, isLoading } = useDealsStats();

  if (renderState === 'not-activated') {
    return <DealsPromoBanner />;
  }

  if (isLoading && (allTime === null || pending === null)) {
    return <DealsLoadingState />;
  }

  if (renderState === 'empty') {
    return <DealsEmptyState />;
  }

  return (
    <DealsBalances
      allTime={allTime}
      lastPayoutAmount={lastPayoutAmount}
      pending={pending}
      lastPendingAmount={lastPendingAmount}
    />
  );
};
