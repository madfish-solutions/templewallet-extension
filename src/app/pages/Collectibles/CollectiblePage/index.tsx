import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { SyncSpinner } from 'app/atoms';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import PageLayout from 'app/layouts/PageLayout';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { dispatch } from 'app/store';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { setTestID } from 'lib/analytics';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { t, T } from 'lib/i18n';
import { buildTokenImagesStack } from 'lib/images-uri';
import { getTokenName } from 'lib/metadata';
import { getCollectibleName, getCollectionName } from 'lib/metadata/utils';
import { useInterval } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { useTezosChainByChainId, useAccountForTezos, useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { TezosAttributes, EvmAttributes } from './components/Attributes';
import { TezosCollectiblePageImage, EvmCollectiblePageImage } from './components/CollectiblePageImage';
import { CollectionDetails } from './components/CollectionDetails';
import { Description } from './components/Description';
import { EvmDetails, TezosDetails } from './components/Details';
import { QuickActionsPopper } from './components/QuickActionsPopper';
import { CollectiblesSelectors } from './selectors';

interface Props {
  chainKind: string;
  chainId: string;
  assetSlug: string;
}

export const CollectiblePage = memo<Props>(({ chainKind, chainId, assetSlug }) =>
  chainKind === TempleChainKind.Tezos ? (
    <TezosContent chainId={chainId} assetSlug={assetSlug} />
  ) : (
    <EvmContent chainId={Number(chainId)} assetSlug={assetSlug} />
  )
);

interface EvmContentProps {
  chainId: number;
  assetSlug: string;
}

const EvmContent = memo<EvmContentProps>(({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const publicKeyHash = useAccountAddressForEvm();
  const metadata = useEvmCollectibleMetadataSelector(chainId, assetSlug);

  if (!publicKeyHash || !network || !metadata) throw new DeadEndBoundaryError();

  const [tab, setTab] = useState<'details' | 'attributes'>('details');

  const detailsTabRef = useRef<HTMLDivElement>(null);
  const attributesTabRef = useRef<HTMLDivElement>(null);

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.EVM, String(chainId), assetSlug)),
    [chainId, assetSlug]
  );

  return (
    <PageLayout headerRightElem={<QuickActionsPopper assetSlug={assetSlug} network={network} />}>
      <div
        className="relative flex items-center justify-center rounded-8 mb-4 overflow-hidden bg-grey-4"
        style={{ aspectRatio: '1/1' }}
      >
        <EvmCollectiblePageImage metadata={metadata} />
      </div>

      <div
        className="max-w-88 max-h-12 mb-2 text-font-regular-bold leading-6 truncate"
        {...setTestID(CollectiblesSelectors.collectibleTitle)}
      >
        {getCollectibleName(metadata)}
      </div>

      <CollectionDetails title={getCollectionName(metadata)} />

      <StyledButton
        size="L"
        color="primary"
        onClick={onSendButtonClick}
        testID={CollectiblesSelectors.sendButton}
        className="my-6"
      >
        <T id="send" />
      </StyledButton>

      <Description text={metadata.description} className="mb-6" />

      {metadata.attributes && metadata.attributes.length > 0 && (
        <SegmentedControl
          name="collectible-details-attributes"
          activeSegment={tab}
          setActiveSegment={setTab}
          className="mb-4"
          segments={[
            {
              label: t('details'),
              value: 'details',
              ref: detailsTabRef
            },
            {
              label: t('attributes'),
              value: 'attributes',
              ref: attributesTabRef
            }
          ]}
        />
      )}

      <div className="w-full">
        {tab === 'attributes' ? (
          <EvmAttributes attributes={metadata.attributes} />
        ) : (
          <EvmDetails network={network} assetSlug={assetSlug} accountPkh={publicKeyHash} metadata={metadata} />
        )}
      </div>
    </PageLayout>
  );
});

const TEZOS_DETAILS_SYNC_INTERVAL = 4 * TEZOS_BLOCK_DURATION;

interface TezosContentProps {
  chainId: string;
  assetSlug: string;
}

const TezosContent = memo<TezosContentProps>(({ chainId, assetSlug }) => {
  const network = useTezosChainByChainId(chainId);
  const account = useAccountForTezos();
  const metadata = useCollectibleMetadataSelector(assetSlug); // Loaded only, if shown in grid for now

  if (!metadata || !network || !account) throw new DeadEndBoundaryError();

  const [tab, setTab] = useState<'details' | 'attributes'>('details');

  const details = useCollectibleDetailsSelector(assetSlug);
  const areAnyCollectiblesDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  const publicKeyHash = account.address;

  const areDetailsLoading = areAnyCollectiblesDetailsLoading && details === undefined;

  const collectibleName = getTokenName(metadata);

  const collection = useMemo(
    () =>
      details && {
        title: details.galleries[0]?.title ?? details.fa.name,
        logo: buildTokenImagesStack(details.fa.logo)
      },
    [details]
  );

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.Tezos, chainId, assetSlug)),
    [chainId, assetSlug]
  );

  useInterval(
    () => void dispatch(loadCollectiblesDetailsActions.submit([assetSlug])),
    [assetSlug],
    TEZOS_DETAILS_SYNC_INTERVAL
  );

  const detailsTabRef = useRef<HTMLDivElement>(null);
  const attributesTabRef = useRef<HTMLDivElement>(null);

  return (
    <PageLayout headerRightElem={<QuickActionsPopper assetSlug={assetSlug} network={network} />}>
      <div
        className="relative flex items-center justify-center rounded-8 mb-4 overflow-hidden bg-grey-4"
        style={{ aspectRatio: '1/1' }}
      >
        <TezosCollectiblePageImage
          metadata={metadata}
          areDetailsLoading={areDetailsLoading}
          objktArtifactUri={details?.objktArtifactUri}
          isAdultContent={details?.isAdultContent}
          mime={details?.mime}
        />
      </div>

      <div
        className="max-w-88 max-h-12 mb-2 text-font-regular-bold leading-6 truncate"
        {...setTestID(CollectiblesSelectors.collectibleTitle)}
      >
        {collectibleName}
      </div>

      {areDetailsLoading ? (
        <SyncSpinner className="mt-6" />
      ) : (
        <>
          <CollectionDetails {...collection} />

          <StyledButton
            size="L"
            color="primary"
            onClick={onSendButtonClick}
            testID={CollectiblesSelectors.sendButton}
            className="my-6"
          >
            <T id="send" />
          </StyledButton>

          <Description text={details?.description} className="mb-6" />

          {details?.attributes && details.attributes.length > 0 && (
            <SegmentedControl
              name="collectible-details-attributes"
              activeSegment={tab}
              setActiveSegment={setTab}
              className="mb-4"
              segments={[
                {
                  label: t('details'),
                  value: 'details',
                  ref: detailsTabRef
                },
                {
                  label: t('attributes'),
                  value: 'attributes',
                  ref: attributesTabRef
                }
              ]}
            />
          )}

          <div className="w-full">
            {tab === 'attributes' ? (
              <TezosAttributes details={details} />
            ) : (
              <TezosDetails network={network} assetSlug={assetSlug} accountPkh={publicKeyHash} details={details} />
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
});
