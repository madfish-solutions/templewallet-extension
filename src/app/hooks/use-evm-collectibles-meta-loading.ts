import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { useEvmStoredCollectiblesRecordSelector } from 'app/store/evm/assets/selectors';
import { loadEvmCollectiblesMetadataAction } from 'app/store/evm/collectibles-metadata/actions';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useEnabledEvmChains } from 'temple/front';

/** TODO: Might wanna tune this loading logic either via pagination or queueing.
 * Pagination for Collectibles is planned for the future.
 */
export const useEvmCollectiblesMetadataLoading = (publicKeyHash: HexString) => {
  const evmChains = useEnabledEvmChains();
  const isLoading = useEvmCollectiblesMetadataLoadingSelector();
  const isLoadingRef = useUpdatableRef(isLoading);
  const isTestnetMode = useTestnetModeEnabledSelector();
  const storedCollectiblesRecord = useEvmStoredCollectiblesRecordSelector();
  const prevPublicKeyHashRef = useRef<HexString | undefined>(undefined);

  useEffect(() => {
    const loadAllChains = prevPublicKeyHashRef.current !== publicKeyHash;
    prevPublicKeyHashRef.current = publicKeyHash;

    dispatch(
      loadEvmCollectiblesMetadataAction({
        publicKeyHash,
        chains: evmChains.map(({ chainId, rpcBaseURL }) => ({ chainId, rpcBaseURL })),
        loadAllChains
      })
    );
  }, [evmChains, isLoadingRef, storedCollectiblesRecord, publicKeyHash, isTestnetMode]);
};
