import React, { memo, useLayoutEffect } from 'react';

import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { useAccount, useTezos } from 'lib/temple/front';
import { confirmOperation } from 'lib/temple/operation';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';

import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { ActionButtonsBar } from './ActionButtonsBar';
import { ContentSection } from './ContentSection';
import EditableTitle from './OtherComponents/EditableTitle';
import MainBanner from './OtherComponents/MainBanner';
import { TokenPageSelectors } from './OtherComponents/TokenPage.selectors';

type Props = {
  assetSlug?: string | null;
};

const Home = memo<Props>(({ assetSlug }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const { onboardingCompleted } = useOnboardingProgress();
  const { publicKeyHash } = useAccount();
  const { search } = useLocation();
  const tezos = useTezos();
  confirmOperation(tezos, 'oopVWbopHEFivyT174dJWaUAPX8TuS1qmZUD9VxLQAWKGEKrBqr').then(
    res => {
      console.log(1, res);
    },
    err => {
      console.error(2, err);
    }
  );

  const assetMetadata = useAssetMetadata(assetSlug || TEZ_TOKEN_SLUG);
  const assetSymbol = getAssetSymbol(assetMetadata);

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
    <PageLayout
      pageTitle={
        assetSlug ? (
          <span
            className="font-normal"
            {...setTestID(TokenPageSelectors.pageName)}
            {...setAnotherSelector('symbol', assetSymbol)}
          >
            {assetSymbol}
          </span>
        ) : null
      }
      attention={true}
      adShow
    >
      {fullPage && (
        <div className="w-full max-w-sm mx-auto">
          <EditableTitle />
          <hr className="mb-4" />
        </div>
      )}

      <div className="flex flex-col items-center mb-6">
        <MainBanner accountPkh={publicKeyHash} assetSlug={assetSlug} />

        <ActionButtonsBar assetSlug={assetSlug} />
      </div>

      <ContentSection assetSlug={assetSlug} />
    </PageLayout>
  ) : (
    <Onboarding />
  );
});

export default Home;
