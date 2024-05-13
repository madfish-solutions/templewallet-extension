import React, { memo, useCallback, useLayoutEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SimpleSegmentControl } from 'app/atoms/SimpleSegmentControl';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout, { PageLayoutProps } from 'app/layouts/PageLayout';
import { useMainnetTokensScamlistSelector } from 'app/store/assets/selectors';
import { ActivityTab } from 'app/templates/activity/Activity';
import { AdvertisingBanner } from 'app/templates/advertising/advertising-banner/advertising-banner';
import { AppHeader } from 'app/templates/AppHeader';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { useAssetMetadata, getAssetSymbol } from 'lib/metadata';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { ActionButtonsBar } from './ActionButtonsBar';
import { AssetBanner } from './OtherComponents/AssetBanner';
import { ScamTokenAlert } from './OtherComponents/ScamTokenAlert';
import { TezosAssetTab } from './OtherComponents/TezosAssetTab';
import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';
import { TokenPageSelectors } from './selectors';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const Home = memo<Props>(({ tezosChainId, assetSlug }) => {
  const { registerBackHandler } = useAppEnv();
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

  const onTokensTabClick = useCallback(() => navigate({ search: 'tab=tokens' }, HistoryAction.Replace), []);
  const onCollectiblesTabClick = useCallback(() => navigate({ search: 'tab=collectibles' }, HistoryAction.Replace), []);

  const pageProps = useMemo<PageLayoutProps>(() => {
    if (tezosChainId && assetSlug)
      return {
        pageTitle: <PageTitle tezosChainId={tezosChainId} assetSlug={assetSlug} />,
        headerRightElem: <AdvertisingBanner />
      };

    return { Header: AppHeader };
  }, [tezosChainId, assetSlug]);

  if (!onboardingCompleted) return <Onboarding />;

  return (
    <PageLayout {...pageProps} contentPadding={false}>
      {showScamTokenAlert && <ScamTokenAlert />}

      <div className="flex flex-col pt-1 px-4">
        {tezosChainId && assetSlug ? (
          <AssetBanner tezosChainId={tezosChainId} assetSlug={assetSlug} />
        ) : (
          <TotalEquityBanner />
        )}

        <ActionButtonsBar tezosChainId={tezosChainId} assetSlug={assetSlug} />

        <SimpleSegmentControl
          firstTitle="Tokens"
          secondTitle="Collectibles"
          activeSecond={tabSlug === 'collectibles'}
          className="mt-6"
          onFirstClick={onTokensTabClick}
          onSecondClick={onCollectiblesTabClick}
        />
      </div>

      <SuspenseContainer key={`${tezosChainId}/${assetSlug}`}>
        {(() => {
          if (!tezosChainId || !assetSlug)
            switch (tabSlug) {
              case 'collectibles':
                return <CollectiblesTab />;
              case 'activity':
                return <ActivityTab />;
              default:
                return <TokensTab />;
            }

          return <TezosAssetTab tezosChainId={tezosChainId} assetSlug={assetSlug} />;
        })()}
      </SuspenseContainer>
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
    <span {...setTestID(TokenPageSelectors.pageName)} {...setAnotherSelector('symbol', assetSymbol)}>
      {assetSymbol}
    </span>
  );
});
