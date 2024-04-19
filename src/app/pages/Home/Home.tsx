import React, { memo, useLayoutEffect } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';

import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { ActionButtonsBar } from './ActionButtonsBar';
import { ContentSection } from './ContentSection';
import EditableTitle from './OtherComponents/EditableTitle';
import MainBanner from './OtherComponents/MainBanner';
import { ScamTokenAlert } from './OtherComponents/ScamTokenAlert';
import { TokenPageSelectors } from './OtherComponents/TokenPage.selectors';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const Home = memo<Props>(({ tezosChainId, assetSlug }) => {
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
    <PageLayout
      pageTitle={tezosChainId && assetSlug ? <PageTitle tezosChainId={tezosChainId} assetSlug={assetSlug} /> : null}
      attention={true}
      adShow
    >
      {fullPage && (
        <div className="w-full max-w-sm mx-auto">
          <EditableTitle />
          <hr className="mb-4" />
        </div>
      )}

      {showScamTokenAlert && <ScamTokenAlert />}

      <div className="flex flex-col items-center mb-6">
        <MainBanner tezosChainId={tezosChainId} assetSlug={assetSlug} />

        <ActionButtonsBar tezosChainId={tezosChainId} assetSlug={assetSlug} />
      </div>

      <ContentSection tezosChainId={tezosChainId} assetSlug={assetSlug} />
    </PageLayout>
  ) : (
    <Onboarding />
  );
});

export default Home;

interface PageTitleProps {
  tezosChainId: string;
  assetSlug: string;
}

const PageTitle = memo<PageTitleProps>(({ tezosChainId, assetSlug }) => {
  const assetMetadata = useAssetMetadata(assetSlug, tezosChainId);
  const assetSymbol = getAssetSymbol(assetMetadata);

  return (
    <span
      className="font-normal"
      {...setTestID(TokenPageSelectors.pageName)}
      {...setAnotherSelector('symbol', assetSymbol)}
    >
      {assetSymbol}
    </span>
  );
});
