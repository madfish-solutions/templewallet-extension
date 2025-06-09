import React, { memo, useCallback, useEffect } from 'react';

import { AssetsSegmentControl } from 'app/atoms/AssetsSegmentControl';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout from 'app/layouts/PageLayout';
import { AppHeader } from 'app/templates/AppHeader';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { toastSuccess } from 'app/toaster';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { HistoryAction, navigate } from 'lib/woozie';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';

const Home = memo(() => {
  const [tabSlug] = useLocationSearchParamValue('tab');
  const { onboardingCompleted } = useOnboardingProgress();

  const [initToastMessage, setInitToastMessage] = useInitToastMessage();

  useEffect(() => {
    if (!initToastMessage) return;

    const timeout = setTimeout(() => {
      setInitToastMessage(undefined);
      toastSuccess(initToastMessage);
    }, 100);

    return () => clearTimeout(timeout);
  }, [initToastMessage, setInitToastMessage]);

  const onTokensTabClick = useCallback(() => navigate({ search: 'tab=tokens' }, HistoryAction.Replace), []);
  const onCollectiblesTabClick = useCallback(() => navigate({ search: 'tab=collectibles' }, HistoryAction.Replace), []);

  if (!onboardingCompleted) return <Onboarding />;

  return (
    <PageLayout Header={AppHeader} contentPadding={false}>
      <div className="flex flex-col pt-1 px-4 bg-white">
        <TotalEquityBanner />

        <ExploreActionButtonsBar additionalButtonType="activity" className="mt-4" />

        <AssetsSegmentControl
          tabSlug={tabSlug}
          className="mt-6"
          onTokensTabClick={onTokensTabClick}
          onCollectiblesTabClick={onCollectiblesTabClick}
        />
      </div>

      <SuspenseContainer>{tabSlug === 'collectibles' ? <CollectiblesTab /> : <TokensTab />}</SuspenseContainer>
    </PageLayout>
  );
});

export default Home;
