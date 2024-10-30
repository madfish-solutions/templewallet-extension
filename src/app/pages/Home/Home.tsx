import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDispatch } from 'react-redux';

import {
  AssetsSegmentControl,
  AssetsSegmentControlRefContext,
  useAssetsSegmentControlRef
} from 'app/atoms/AssetsSegmentControl';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout, { PageLayoutProps } from 'app/layouts/PageLayout';
import { setToastsContainerBottomShiftAction } from 'app/store/settings/actions';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { AdvertisingBanner } from 'app/templates/advertising/advertising-banner/advertising-banner';
import { AppHeader } from 'app/templates/AppHeader';
import { toastSuccess } from 'app/toaster';
import { SuccessfulInitToastContext } from 'lib/temple/front/successful-init-toast-context';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';
import Onboarding from '../Onboarding/Onboarding';

import { ActionButtonsBar } from './ActionButtonsBar';
import { HomeProps } from './interfaces';
import { AssetBanner } from './OtherComponents/AssetBanner';
import { AssetTab } from './OtherComponents/AssetTab';
import { ScamTokenAlert } from './OtherComponents/ScamTokenAlert';
import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';
import { PageTitle } from './PageTitle';

const Home = memo<HomeProps>(props => {
  const { chainKind, chainId, assetSlug } = props;
  const { registerBackHandler } = useAppEnv();
  const tabSlug = useLocationSearchParamValue('tab');
  const { onboardingCompleted } = useOnboardingProgress();
  const { search } = useLocation();
  const dispatch = useDispatch();

  const [initToastMessage, setInitToastMessage] = useContext(SuccessfulInitToastContext);

  useEffect(() => {
    if (!initToastMessage) return;

    const timeout = setTimeout(() => {
      dispatch(setToastsContainerBottomShiftAction(0));
      setInitToastMessage(undefined);
      toastSuccess(initToastMessage);
    }, 100);

    return () => clearTimeout(timeout);
  }, [dispatch, initToastMessage, setInitToastMessage]);

  const assetsSegmentControlRef = useAssetsSegmentControlRef();

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
    if (assetSlug)
      return {
        pageTitle: <PageTitle {...props} />,
        headerRightElem: <AdvertisingBanner />
      };

    return { Header: AppHeader };
  }, [assetSlug, props]);

  if (!onboardingCompleted) return <Onboarding />;

  return (
    <PageLayout {...pageProps} contentPadding={false}>
      {showScamTokenAlert && <ScamTokenAlert />}

      <div className="flex flex-col pt-1 px-4 bg-white">
        {chainKind && chainId && assetSlug ? (
          <AssetBanner chainKind={chainKind} chainId={chainId} assetSlug={assetSlug} />
        ) : (
          <TotalEquityBanner />
        )}

        <ActionButtonsBar {...props} />

        {!assetSlug && (
          <AssetsSegmentControl
            tabSlug={tabSlug}
            className="mt-6"
            onTokensTabClick={onTokensTabClick}
            onCollectiblesTabClick={onCollectiblesTabClick}
          />
        )}
      </div>

      <SuspenseContainer key={`${chainId}/${assetSlug}`}>
        <AssetsSegmentControlRefContext.Provider value={assetsSegmentControlRef}>
          {(() => {
            if (!chainKind || !chainId || !assetSlug)
              switch (tabSlug) {
                case 'collectibles':
                  return <CollectiblesTab />;
                default:
                  return <TokensTab />;
              }

            return <AssetTab chainKind={chainKind} chainId={chainId} assetSlug={assetSlug} />;
          })()}
        </AssetsSegmentControlRefContext.Provider>
      </SuspenseContainer>
    </PageLayout>
  );
});

export default Home;
