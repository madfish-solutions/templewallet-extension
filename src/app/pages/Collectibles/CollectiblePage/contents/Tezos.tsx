import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { ScamTokenAlert } from 'app/pages/Token/ScamTokenAlert';
import { dispatch } from 'app/store';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { buildTokenImagesStack } from 'lib/images-uri';
import { getTokenName } from 'lib/metadata';
import { useBooleanState } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { useTezosChainByChainId, useAccountForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TezosAttributes } from '../components/Attributes';
import { TezosCollectiblePageImage } from '../components/CollectiblePageImage';
import { CollectionDetails } from '../components/CollectionDetails';
import { TezosDetails } from '../components/Details';
import { ListForSaleModal } from '../components/ListForSaleModal';
import { QuickActionsPopper } from '../components/QuickActionsPopper';

import { BaseContent } from './Base';
import { TezosNoMetadataContent } from './NoMetadata';

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

  const [isListForSaleModalOpen, openListForSaleModal, closeListForSaleModal] = useBooleanState(false);

  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const showScamTokenAlert = isDefined(assetSlug) && mainnetTokensScamSlugsRecord[assetSlug];

  if (!network || !account) throw new DeadEndBoundaryError();

  const accountPkh = account.address;
  const areDetailsLoading = areAnyCollectiblesDetailsLoading && details === undefined;

  const { contract: contractAddress, id: tokenId } = useMemo(() => fromFa2TokenSlug(assetSlug), [assetSlug]);

  const { value: balance } = useTezosAssetBalance(assetSlug, accountPkh, network);
  const isOwnedByUser = useMemo(() => balance?.gt(0) ?? false, [balance]);
  const canListForSale = useMemo(() => isOwnedByUser && isDefined(details), [isOwnedByUser, details]);

  const listForSaleTestIDProperties = useMemo(() => ({ contractAddress, tokenId }), [contractAddress, tokenId]);

  useEffect(() => void dispatch(loadCollectiblesDetailsActions.submit([assetSlug])), [assetSlug]);

  const collectibleName = getTokenName(metadata);

  const collection = useMemo(() => {
    if (!details) return null;
    return {
      title: details.galleries[0]?.title ?? details.fa.name,
      logoSrc: buildTokenImagesStack(details.fa.logo)[0]
    };
  }, [details]);

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.Tezos, chainId, assetSlug)),
    [chainId, assetSlug]
  );

  if (!metadata) return <TezosNoMetadataContent assetSlug={assetSlug} network={network} accountPkh={accountPkh} />;

  const showSegmentControl = details?.attributes && details?.attributes.length > 0;

  return (
    <>
      <BaseContent
        headerRightElement={<QuickActionsPopper assetSlug={assetSlug} network={network} />}
        scamAlertElement={
          showScamTokenAlert && <ScamTokenAlert isCollectible={true} tezosChainId={chainId} assetSlug={assetSlug} />
        }
        imageElement={
          <TezosCollectiblePageImage
            assetSlug={assetSlug}
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
        onListForSale={canListForSale ? openListForSaleModal : undefined}
        listForSaleTestIDProperties={listForSaleTestIDProperties}
        description={details?.description}
        showSegmentControl={showSegmentControl}
        isLoading={areDetailsLoading}
        detailsElement={
          <TezosDetails network={network} assetSlug={assetSlug} accountPkh={accountPkh} details={details} />
        }
        attributesElement={<TezosAttributes details={details} />}
      />
      <ListForSaleModal
        isOpen={isListForSaleModalOpen}
        onClose={closeListForSaleModal}
        contractAddress={contractAddress}
        tokenId={tokenId}
      />
    </>
  );
});
