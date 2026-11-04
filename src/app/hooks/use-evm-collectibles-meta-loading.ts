import { useEffect, useRef, useSyncExternalStore } from 'react';

import { dispatch } from 'app/store';
import { useEvmStoredCollectiblesRecordSelector } from 'app/store/evm/assets/selectors';
import {
  cancelEvmCollectiblesMetadataLoadingAction,
  loadEvmCollectiblesMetadataAction
} from 'app/store/evm/collectibles-metadata/actions';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { useEnabledEvmChains } from 'temple/front';

import {
  getRequestedEvmCollectibleSlugs,
  getRequestedEvmCollectiblesSnapshot,
  subscribeToRequestedEvmCollectibles
} from './use-evm-collectible-metadata-request';

export const useEvmCollectiblesMetadataLoading = (
  publicKeyHash: HexString,
  readAllInBackground = false,
  selectedChainIds: (number | string)[] = EMPTY_FROZEN_ARRAY
) => {
  const evmChains = useEnabledEvmChains();
  const isTestnetMode = useTestnetModeEnabledSelector();
  const storedCollectiblesRecord = useEvmStoredCollectiblesRecordSelector();
  const prevPublicKeyHashRef = useRef<HexString | undefined>(undefined);
  const requestedSlugsSnapshot = useSyncExternalStore(
    subscribeToRequestedEvmCollectibles,
    getRequestedEvmCollectiblesSnapshot
  );

  useEffect(() => {
    const restartSession = prevPublicKeyHashRef.current !== publicKeyHash;
    prevPublicKeyHashRef.current = publicKeyHash;

    dispatch(
      loadEvmCollectiblesMetadataAction({
        publicKeyHash,
        chains: evmChains.map(({ chainId, rpcBaseURL }) => ({ chainId, rpcBaseURL })),
        restartSession,
        visibleSlugsByChain: getRequestedEvmCollectibleSlugs(),
        readAllInBackground,
        priorityChainIds: selectedChainIds.filter((chainId): chainId is number => typeof chainId === 'number')
      })
    );
  }, [
    evmChains,
    storedCollectiblesRecord,
    publicKeyHash,
    isTestnetMode,
    requestedSlugsSnapshot,
    readAllInBackground,
    selectedChainIds
  ]);

  useWillUnmount(() => void dispatch(cancelEvmCollectiblesMetadataLoadingAction()));
};
