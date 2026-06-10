import { memo, useEffect } from 'react';

import { capitalize } from 'lodash';

import { PageTitle } from 'app/atoms';
import { acknowledgeRewardsBadge } from 'app/hooks/use-rewards-badge';
import PageLayout from 'app/layouts/PageLayout';
import { YourRewardsSection } from 'app/pages/Rewards/YourRewardsSection';
import { t } from 'lib/i18n';

import { ReferralsCard } from './referrals-card';

export const RewardsPage = memo(() => {
  useEffect(() => void acknowledgeRewardsBadge(), []);

  return (
    <PageLayout pageTitle={<PageTitle title={capitalize(t('rewards'))} />}>
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
        <ReferralsCard />
        <YourRewardsSection />
      </div>
    </PageLayout>
  );
});
