import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import {
  useAssetsFilterOptionsSelector,
  useCollectiblesListOptionsSelector
} from 'app/store/assets-filter-options/selectors';
import { useEvmStoredCollectiblesRecordSelector } from 'app/store/evm/assets/selectors';
import {
  loadEvmCollectiblesMetadataAction,
  propagateEvmContractCollectionNamesAction
} from 'app/store/evm/collectibles-metadata/actions';
import { openseaNftRefsFromVisibleSlugs } from 'app/store/evm/collectibles-metadata/opensea';
import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { isSharedStorefrontTokenId } from 'app/store/evm/collectibles-metadata/utils';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { deadEvmCollectiblePreviewSlugs, useDeadEvmCollectiblePreviewVersion } from './evm-collectible-dead-preview';
import {
  EVM_COLLECTIBLE_VISIBILITY_PUBLISH_DELAY_MS,
  useVisibleEvmCollectibleSlugs
} from './evm-collectible-visibility';

/** Nameless collectibles already sent to OpenSea during this session. */
const collectionNameRequestedSlugs = new Set<string>();

/** TODO: Might wanna tune this loading logic either via pagination or queueing.
 * Pagination for Collectibles is planned for the future.
 */
export const useEvmCollectiblesMetadataLoading = (publicKeyHash: HexString) => {
  const evmChains = useEnabledEvmChains();
  const isLoading = useEvmCollectiblesMetadataLoadingSelector();
  const isLoadingRef = useUpdatableRef(isLoading);
  const isTestnetMode = useTestnetModeEnabledSelector();
  const storedCollectiblesRecord = useEvmStoredCollectiblesRecordSelector();
  const metadataRecord = useEvmCollectiblesMetadataRecordSelector();
  const metadataRef = useUpdatableRef(metadataRecord);
  const visibleSlugs = useVisibleEvmCollectibleSlugs();
  const visibleSlugsRef = useUpdatableRef(visibleSlugs);
  const { viewAsCollections } = useCollectiblesListOptionsSelector();
  const filterChainId = useAssetsFilterOptionsSelector().filterChain?.chainId ?? '';
  const listingKey = `${viewAsCollections}:${filterChainId}`;
  const deadPreviewVersion = useDeadEvmCollectiblePreviewVersion();
  const prevPublicKeyHashRef = useRef<HexString | undefined>(undefined);
  const prevCollectiblesRef = useRef(storedCollectiblesRecord[publicKeyHash]);
  const prevContextRef = useRef('');
  const prevOpenseaRefsKeyRef = useRef('');
  const prevListingKeyRef = useRef<string | undefined>(undefined);
  const pendingListingReloadRef = useRef(false);
  const slugsAtListingChangeRef = useRef(visibleSlugs);

  useEffect(() => {
    dispatch(propagateEvmContractCollectionNamesAction());
  }, [metadataRecord]);

  const startLoadRef = useUpdatableRef(() => {
    const loadAllChains = prevPublicKeyHashRef.current !== publicKeyHash;
    const collectibles = storedCollectiblesRecord[publicKeyHash];
    const openseaNftRefs = openseaNftRefsFromVisibleSlugs(
      visibleSlugs,
      metadataRef.current,
      deadEvmCollectiblePreviewSlugs(),
      collectionNameRequestedSlugs
    );
    const openseaRefsKey = openseaNftRefs.map(ref => `${ref.chainId}:${ref.contractAddress}:${ref.tokenId}`).join('|');
    const contextKey = `${publicKeyHash}:${isTestnetMode}:${evmChains
      .map(chain => `${chain.chainId}:${chain.rpcBaseURL}`)
      .join(',')}`;
    const collectiblesChanged = prevCollectiblesRef.current !== collectibles;

    if (
      !loadAllChains &&
      !collectiblesChanged &&
      prevContextRef.current === contextKey &&
      (prevOpenseaRefsKeyRef.current === openseaRefsKey || !openseaNftRefs.length)
    ) {
      prevOpenseaRefsKeyRef.current = openseaRefsKey;

      return;
    }

    prevPublicKeyHashRef.current = publicKeyHash;
    prevCollectiblesRef.current = collectibles;
    prevContextRef.current = contextKey;
    prevOpenseaRefsKeyRef.current = openseaRefsKey;

    dispatch(
      loadEvmCollectiblesMetadataAction({
        publicKeyHash,
        chains: evmChains.map(({ chainId, rpcBaseURL }) => ({ chainId, rpcBaseURL })),
        loadAllChains,
        openseaNftRefs
      })
    );

    for (const ref of openseaNftRefs) {
      const assetSlug = toTokenSlug(ref.contractAddress, ref.tokenId);
      const metadata = metadataRef.current?.[ref.chainId]?.[assetSlug];
      const collectionKnown = isSharedStorefrontTokenId(ref.tokenId) ? metadata?.openseaCollection : metadata?.name;
      if (collectionKnown) continue;

      collectionNameRequestedSlugs.add(toChainAssetSlug(TempleChainKind.EVM, ref.chainId, assetSlug));
    }
  });

  useEffect(() => {
    if (prevListingKeyRef.current === undefined) {
      prevListingKeyRef.current = listingKey;

      return;
    }

    if (prevListingKeyRef.current === listingKey) return;

    prevListingKeyRef.current = listingKey;
    prevOpenseaRefsKeyRef.current = '';
    pendingListingReloadRef.current = true;
    slugsAtListingChangeRef.current = visibleSlugsRef.current;
    const timer = window.setTimeout(() => {
      if (!pendingListingReloadRef.current) return;

      pendingListingReloadRef.current = false;
      startLoadRef.current();
    }, EVM_COLLECTIBLE_VISIBILITY_PUBLISH_DELAY_MS + 100);

    return () => window.clearTimeout(timer);
  }, [listingKey, startLoadRef, visibleSlugsRef]);

  useEffect(() => {
    if (pendingListingReloadRef.current && visibleSlugs === slugsAtListingChangeRef.current) return;

    pendingListingReloadRef.current = false;
    startLoadRef.current();
  }, [
    evmChains,
    isLoadingRef,
    metadataRef,
    storedCollectiblesRecord,
    publicKeyHash,
    isTestnetMode,
    visibleSlugs,
    deadPreviewVersion,
    startLoadRef
  ]);
};
