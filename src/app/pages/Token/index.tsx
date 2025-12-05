import React, { FC, memo, useLayoutEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { ReactComponent as InfoSvg } from 'app/icons/base/info.svg';
import { ContentContainer } from 'app/layouts/containers';
import PageLayout, { PageLayoutProps } from 'app/layouts/PageLayout';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { ActivityListContainer, EvmActivityList, TezosActivityList } from 'app/templates/activity';
import { DepositModal } from 'app/templates/DepositModal';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { isTezAsset, TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmCategorizedAssetMetadata, useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { HistoryAction, navigate, useLocation } from 'lib/woozie';
import { TempleChainKind } from 'temple/types';

import { EvmAssetBanner, TezosAssetBanner } from './AssetBanner';
import { EvmInfoModalContent, TezosInfoModalContent } from './InfoModal';
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

    return;
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

  const [infoModalOpen, setInfoModalOpen, setInfoModalClosed] = useBooleanState(false);
  const [depositModalOpened, openDepositModal, closeDepositModal] = useBooleanState(false);

  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, chainId);

  const pageProps = useMemo<PageLayoutProps>(
    () => ({
      pageTitle: <TezosPageTitle tezosChainId={chainId} assetSlug={assetSlug} />,
      headerRightElem: <IconBase Icon={InfoSvg} className="text-primary cursor-pointer" onClick={setInfoModalOpen} />
    }),
    [setInfoModalOpen, assetSlug, chainId]
  );

  const additionalButtonType = useMemo(
    () => (isTezAsset(assetSlug) ? 'earn-tez' : assetSlug === TEMPLE_TOKEN_SLUG ? 'earn-tkey' : undefined),
    [assetSlug]
  );

  return (
    <>
      <PageModal title="Token Info" opened={infoModalOpen} contentPadding onRequestClose={setInfoModalClosed}>
        {() => <TezosInfoModalContent assetSlug={assetSlug} chainId={chainId} assetMetadata={assetMetadata} />}
      </PageModal>

      <PageLayout {...pageProps} contentPadding={false}>
        <div className="flex flex-col p-4 gap-y-3 bg-white">
          {showScamTokenAlert && <ScamTokenAlert isCollectible={false} tezosChainId={chainId} assetSlug={assetSlug} />}
          <TezosAssetBanner chainId={chainId} assetSlug={assetSlug} />

          <ExploreActionButtonsBar
            chainKind={TempleChainKind.Tezos}
            chainId={chainId}
            assetSlug={assetSlug}
            additionalButtonType={additionalButtonType}
            onDepositClick={openDepositModal}
          />
        </div>

        <SuspenseContainer key={`${chainId}/${assetSlug}`}>
          <ContentContainer>
            <ActivityListContainer chainId={chainId} assetSlug={assetSlug}>
              <TezosActivityList tezosChainId={chainId} assetSlug={assetSlug} />
            </ActivityListContainer>
          </ContentContainer>
        </SuspenseContainer>
      </PageLayout>

      <DepositModal chainKind={TempleChainKind.Tezos} opened={depositModalOpened} onRequestClose={closeDepositModal} />
    </>
  );
};

interface EvmTokenPageProps {
  chainId: number;
  assetSlug: string;
}

const EvmTokenPage: FC<EvmTokenPageProps> = ({ chainId, assetSlug }) => {
  const [infoModalOpen, setInfoModalOpen, setInfoModalClosed] = useBooleanState(false);
  const [depositModalOpened, openDepositModal, closeDepositModal] = useBooleanState(false);

  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, chainId);

  const pageProps = useMemo<PageLayoutProps>(
    () => ({
      pageTitle: <EvmPageTitle evmChainId={chainId} assetSlug={assetSlug} />,
      headerRightElem: <IconBase Icon={InfoSvg} className="text-primary cursor-pointer" onClick={setInfoModalOpen} />
    }),
    [assetSlug, chainId, setInfoModalOpen]
  );

  const additionalButtonType = useMemo(
    () => (assetSlug === EVM_TOKEN_SLUG && chainId === ETHEREUM_MAINNET_CHAIN_ID ? 'earn-eth' : undefined),
    [assetSlug, chainId]
  );

  return (
    <>
      <PageModal title="Token Info" opened={infoModalOpen} contentPadding onRequestClose={setInfoModalClosed}>
        {() => <EvmInfoModalContent assetSlug={assetSlug} chainId={chainId} assetMetadata={assetMetadata} />}
      </PageModal>

      <PageLayout {...pageProps} contentPadding={false}>
        <div className="flex flex-col p-4 gap-y-3 bg-white">
          <EvmAssetBanner chainId={chainId} assetSlug={assetSlug} />

          <ExploreActionButtonsBar
            chainKind={TempleChainKind.EVM}
            chainId={String(chainId)}
            assetSlug={assetSlug}
            additionalButtonType={additionalButtonType}
            onDepositClick={openDepositModal}
          />
        </div>

        <SuspenseContainer key={`${chainId}/${assetSlug}`}>
          <ContentContainer>
            <ActivityListContainer chainId={chainId} assetSlug={assetSlug}>
              <EvmActivityList chainId={chainId} assetSlug={assetSlug} />
            </ActivityListContainer>
          </ContentContainer>
        </SuspenseContainer>
      </PageLayout>

      <DepositModal chainKind={TempleChainKind.EVM} opened={depositModalOpened} onRequestClose={closeDepositModal} />
    </>
  );
};
