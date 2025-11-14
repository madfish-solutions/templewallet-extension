import { useEffect, useMemo } from 'react';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useAllEvmChainsBalancesLoadingStatesSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_ZERO_ADDRESS, SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY } from 'lib/constants';
import { DEFAULT_EVM_CHAINS_SPECS, EvmChainSpecs } from 'lib/temple/chains-specs';
import { useStorage } from 'lib/temple/front';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useAccountAddressForEvm, useEnabledEvmChains } from 'temple/front';
import { useEvmChainsSpecs } from 'temple/front/use-chains-specs';

const chainIdsToDisableCandidates = Object.entries(DEFAULT_EVM_CHAINS_SPECS)
  .filter(([chainId, { testnet }]) => !testnet && Number(chainId) !== COMMON_MAINNET_CHAIN_IDS.etherlink)
  .map(([chainId]) => Number(chainId));

export const useDisableInactiveNetworks = () => {
  const evmAddress = useAccountAddressForEvm();
  const enabledEvmChains = useEnabledEvmChains();
  const [shouldDisable, setShouldDisable] = useStorage<boolean>(SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY, false);
  const [, setEvmChainsSpecs] = useEvmChainsSpecs();

  const evmTokensMetadata = useEvmTokensMetadataRecordSelector();
  const evmTokensMetadataLoading = useEvmTokensMetadataLoadingSelector();

  const rawEvmAccountBalances = useRawEvmAccountBalancesSelector(evmAddress ?? EVM_ZERO_ADDRESS);
  const evmBalancesLoadingStates = useAllEvmChainsBalancesLoadingStatesSelector();
  const evmBalancesLoading = useMemo(
    () => Object.values(evmBalancesLoadingStates).some(({ onchain, api }) => onchain.isLoading || api.isLoading),
    [evmBalancesLoadingStates]
  );
  const evmBalancesInitialized = useMemo(
    () => evmAddress && enabledEvmChains.every(({ chainId }) => rawEvmAccountBalances[chainId] !== undefined),
    [enabledEvmChains, evmAddress, rawEvmAccountBalances]
  );

  useEffect(() => {
    if (shouldDisable && !evmTokensMetadataLoading && !evmBalancesLoading && evmBalancesInitialized) {
      setEvmChainsSpecs(prevSpecs => ({
        ...prevSpecs,
        ...Object.fromEntries(
          chainIdsToDisableCandidates.map((chainId): [number, EvmChainSpecs] => {
            const disabled = !Object.entries(rawEvmAccountBalances[chainId] ?? {}).some(
              ([assetSlug, balance]) =>
                (evmTokensMetadata[chainId]?.[assetSlug] || isEvmNativeTokenSlug(assetSlug)) && Number(balance) > 0
            );

            return [chainId, { ...prevSpecs[chainId], disabled, disabledAutomatically: disabled }];
          })
        )
      }));
      setShouldDisable(false);
    }
  }, [
    evmBalancesInitialized,
    evmBalancesLoading,
    evmTokensMetadata,
    evmTokensMetadataLoading,
    rawEvmAccountBalances,
    setEvmChainsSpecs,
    setShouldDisable,
    shouldDisable
  ]);
};
