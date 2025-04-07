import React, { memo, useCallback, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { buildTokenImagesStack } from 'lib/images-uri';
import { getTokenName } from 'lib/metadata';
import { useInterval } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { useTezosChainByChainId, useAccountForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TezosAttributes } from '../components/Attributes';
import { TezosCollectiblePageImage } from '../components/CollectiblePageImage';
import { CollectionDetails } from '../components/CollectionDetails';
import { TezosDetails } from '../components/Details';
import { QuickActionsPopper } from '../components/QuickActionsPopper';

import { BaseContent } from './Base';

const TEZOS_DETAILS_SYNC_INTERVAL = 4 * TEZOS_BLOCK_DURATION;

interface Props {
  chainId: string;
  assetSlug: string;
}

export const TezosContent = memo<Props>(({ chainId, assetSlug }) => {
  const network = useTezosChainByChainId(chainId);
  const account = useAccountForTezos();
  const metadata = useCollectibleMetadataSelector(assetSlug);
  const details = useCollectibleDetailsSelector(assetSlug);
  const areAnyCollectiblesDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  if (!metadata || !network || !account) throw new DeadEndBoundaryError();

  const publicKeyHash = account.address;
  const areDetailsLoading = areAnyCollectiblesDetailsLoading && details === undefined;

  useInterval(
    () => void dispatch(loadCollectiblesDetailsActions.submit([assetSlug])),
    [assetSlug],
    TEZOS_DETAILS_SYNC_INTERVAL
  );

  const collectibleName = getTokenName(metadata);

  const collection = useMemo(() => {
    if (!details) return null;
    return {
      title: details.galleries[0]?.title ?? details.fa.name,
      logo: buildTokenImagesStack(details.fa.logo)
    };
  }, [details]);

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.Tezos, chainId, assetSlug)),
    [chainId, assetSlug]
  );

  const showSegmentControl = details?.attributes && details?.attributes.length > 0;

  return (
    <BaseContent
      headerRightElement={<QuickActionsPopper assetSlug={assetSlug} network={network} />}
      imageElement={
        <TezosCollectiblePageImage
          metadata={metadata}
          areDetailsLoading={areDetailsLoading}
          objktArtifactUri={details?.objktArtifactUri}
          isAdultContent={details?.isAdultContent}
          mime={details?.mime}
        />
      }
      collectibleName={collectibleName}
      collectionDetailsElement={<CollectionDetails {...collection} />}
      onSend={onSendButtonClick}
      description={details?.description}
      showSegmentControl={showSegmentControl}
      isLoading={areDetailsLoading}
      detailsElement={
        <TezosDetails network={network} assetSlug={assetSlug} accountPkh={publicKeyHash} details={details} />
      }
      attributesElement={<TezosAttributes details={details} />}
    />
  );
});
