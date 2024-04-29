import React, { memo, useLayoutEffect } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';

import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { ActionButtonsBar } from './ActionButtonsBar';
import { ContentSection } from './ContentSection';
import { HomeProps } from './interfaces';
import EditableTitle from './OtherComponents/EditableTitle';
import MainBanner from './OtherComponents/MainBanner';
import { ScamTokenAlert } from './OtherComponents/ScamTokenAlert';
import { PageTitle } from './PageTitle';

const Home = memo<HomeProps>(props => {
  const { assetSlug } = props;
  const { fullPage, registerBackHandler } = useAppEnv();
  const { onboardingCompleted } = useOnboardingProgress();
  const { search } = useLocation();

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const showScamTokenAlert = isDefined(assetSlug) && mainnetTokensScamSlugsRecord[assetSlug];

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (assetSlug && usp.get('after_token_added') === 'true') {
      return registerBackHandler(() => {
        navigate('/', HistoryAction.Replace);
      });
    }
    return undefined;
  }, [registerBackHandler, assetSlug, search]);

  return onboardingCompleted ? (
    <PageLayout pageTitle={<PageTitle {...props} />} attention={true} adShow>
      {fullPage && (
        <div className="w-full max-w-sm mx-auto">
          <EditableTitle />
          <hr className="mb-4" />
        </div>
      )}

      {showScamTokenAlert && <ScamTokenAlert />}

      <div className="flex flex-col items-center mb-6">
        <MainBanner {...props} />

        <ActionButtonsBar {...props} />
      </div>

      <ContentSection {...props} />
    </PageLayout>
  ) : (
    <Onboarding />
  );
});

export default Home;
