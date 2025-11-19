import { useAllTokensMetadataSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { migrateFromIndexedDB } from 'lib/assets/migrations';
import { SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY, EVM_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { migrate } from 'lib/local-storage/migrator';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useDidMount } from 'lib/ui/hooks';

export const useAssetsMigrations = () => {
  const allMetadatas = useAllTokensMetadataSelector();

  useDidMount(
    () =>
      void migrate([
        {
          name: 'assets-migrations@1.18.2',
          up: () => migrateFromIndexedDB(allMetadatas)
        },
        {
          name: 'networks-auto-disable@2.0.15',
          up: () => putToStorage(SHOULD_DISABLE_NOT_ACTIVE_NETWORKS_STORAGE_KEY, true)
        },
        {
          name: 'etherlink-always-enabled@2.0.15',
          up: async () => {
            const stored = (await fetchFromStorage<Record<string, any>>(EVM_CHAINS_SPECS_STORAGE_KEY)) ?? {};
            await putToStorage(EVM_CHAINS_SPECS_STORAGE_KEY, {
              ...stored,
              [ETHERLINK_MAINNET_CHAIN_ID]: {
                ...(stored?.[ETHERLINK_MAINNET_CHAIN_ID] ?? {}),
                disabled: false,
                disabledAutomatically: false,
                testnet: false
              }
            });
          }
        }
      ])
  );
};
