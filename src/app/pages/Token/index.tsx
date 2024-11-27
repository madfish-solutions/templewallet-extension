import React, { FC, memo, useLayoutEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { ContentContainer } from 'app/layouts/containers';
import PageLayout, { PageLayoutProps } from 'app/layouts/PageLayout';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { AdvertisingBanner } from 'app/templates/advertising/advertising-banner/advertising-banner';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';
import { TempleChainKind } from 'temple/types';

import { EvmAssetBanner, TezosAssetBanner } from './AssetBanner';
import { EvmAssetTab, TezosAssetTab } from './AssetTab';
import { EvmPageTitle, TezosPageTitle } from './PageTitle';
import { ScamTokenAlert } from './ScamTokenAlert';

interface Props {
  chainKind: string;
  chainId: string;
  assetSlug: string;
}

export const TokenPage = memo<Props>(({ chainId, chainKind, assetSlug }) => {
  const { search } = useLocation();
  const { registerBackHandler } = useAppEnv();

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (usp.get('after_token_added') === 'true') {
      return registerBackHandler(() => {
        navigate('/', HistoryAction.Replace);
      });
    }
    return undefined;
  }, [registerBackHandler, assetSlug, search]);

  return chainKind === TempleChainKind.Tezos ? (
    <TezosTokenPage chainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmTokenPage chainId={Number(chainId)} assetSlug={assetSlug} />
  );
});

interface TezosTokenPageProps {
  chainId: string;
  assetSlug: string;
}

const TezosTokenPage: FC<TezosTokenPageProps> = ({ chainId, assetSlug }) => {
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const showScamTokenAlert = isDefined(assetSlug) && mainnetTokensScamSlugsRecord[assetSlug];

  const pageProps = useMemo<PageLayoutProps>(
    () => ({
      pageTitle: <TezosPageTitle tezosChainId={chainId} assetSlug={assetSlug} />,
      headerRightElem: <AdvertisingBanner />
    }),
    [assetSlug, chainId]
  );

  return (
    <PageLayout {...pageProps} contentPadding={false}>
      {showScamTokenAlert && <ScamTokenAlert />}

      <div className="flex flex-col pt-1 px-4 bg-white">
        <TezosAssetBanner tezosChainId={chainId} assetSlug={assetSlug} />

        <ExploreActionButtonsBar chainKind={TempleChainKind.Tezos} chainId={chainId} assetSlug={assetSlug} />
      </div>

      <SuspenseContainer key={`${chainId}/${assetSlug}`}>
        <ContentContainer className="mt-3">
          <TezosAssetTab chainId={chainId} assetSlug={assetSlug} />
        </ContentContainer>
      </SuspenseContainer>
    </PageLayout>
  );
};

interface EvmTokenPageProps {
  chainId: number;
  assetSlug: string;
}

const EvmTokenPage: FC<EvmTokenPageProps> = ({ chainId, assetSlug }) => {
  const pageProps = useMemo<PageLayoutProps>(
    () => ({
      pageTitle: <EvmPageTitle evmChainId={chainId} assetSlug={assetSlug} />,
      headerRightElem: <AdvertisingBanner />
    }),
    [assetSlug, chainId]
  );

  return (
    <PageLayout {...pageProps} contentPadding={false}>
      <div className="flex flex-col pt-1 px-4 bg-white">
        <EvmAssetBanner evmChainId={chainId} assetSlug={assetSlug} />

        <ExploreActionButtonsBar chainKind={TempleChainKind.EVM} chainId={String(chainId)} assetSlug={assetSlug} />
      </div>

      <SuspenseContainer key={`${chainId}/${assetSlug}`}>
        <ContentContainer className="mt-3">
          <EvmAssetTab chainId={chainId} assetSlug={assetSlug} />
        </ContentContainer>
      </SuspenseContainer>
    </PageLayout>
  );
};
