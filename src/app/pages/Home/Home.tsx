import React, { memo, useLayoutEffect } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SimpleSegmentControl } from 'app/atoms/SimpleSegmentControl';
import { useAppEnv } from 'app/env';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout from 'app/layouts/PageLayout';
import { useMainnetTokensScamlistSelector } from 'app/store/assets/selectors';
import { ActivityTab } from 'app/templates/activity/Activity';
import AssetInfo from 'app/templates/AssetInfo';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { ActionButtonsBar } from './ActionButtonsBar';
import { ContentSection } from './ContentSection';
import BakingSection from './OtherComponents/BakingSection';
import EditableTitle from './OtherComponents/EditableTitle';
import MainBanner from './OtherComponents/MainBanner';
import { ScamTokenAlert } from './OtherComponents/ScamTokenAlert';
import { TezosAssetTab } from './OtherComponents/TezosAssetTab';
import { TokenPageSelectors } from './OtherComponents/TokenPage.selectors';
import { TokensTab } from './OtherComponents/Tokens/Tokens';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const Home = memo<Props>(({ tezosChainId, assetSlug }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const tabSlug = useLocationSearchParamValue('tab');
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

  if (!onboardingCompleted) return <Onboarding />;

  return (
    <PageLayout
      pageTitle={tezosChainId && assetSlug ? <PageTitle tezosChainId={tezosChainId} assetSlug={assetSlug} /> : null}
      attention={true}
      withToolbarAd
    >
      {/* {fullPage && (
        <div className="w-full max-w-sm mx-auto">
          <EditableTitle />
          <hr className="mb-4" />
        </div>
      )} */}

      {showScamTokenAlert && <ScamTokenAlert />}

      <div className="flex flex-col pt-1 px-4 pb-3 bg-white">
        <MainBanner tezosChainId={tezosChainId} assetSlug={assetSlug} />

        <ActionButtonsBar tezosChainId={tezosChainId} assetSlug={assetSlug} />

        <SimpleSegmentControl
          firstTitle="Tokens"
          secondTitle="Collectibles"
          activeSecond={tabSlug === 'collectibles'}
          className="mt-6"
          onFirstClick={() => void navigate({ search: 'tab=tokens' }, HistoryAction.Replace)}
          onSecondClick={() => void navigate({ search: 'tab=collectibles' }, HistoryAction.Replace)}
        />
      </div>

      {/* <ContentSection tezosChainId={tezosChainId} assetSlug={assetSlug} /> */}

      <div className="px-4 bg-background shadow-content-inset">
        {/* TODO: ErrorBoundary + Suspense */}
        {(() => {
          if (!tezosChainId || !assetSlug)
            switch (tabSlug) {
              case 'collectibles':
                return <CollectiblesTab scrollToTheTabsBar={() => void 0} />;
              case 'activity':
                return <ActivityTab />;
              default:
                return <TokensTab />;
            }

          return <TezosAssetTab tezosChainId={tezosChainId} assetSlug={assetSlug} />;
        })()}
      </div>
    </PageLayout>
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
