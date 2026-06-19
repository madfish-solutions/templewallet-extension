import { isNotEmptyString } from '@rnw-community/shared';

import {
  AUTOLOCK_TIME_STORAGE_KEY,
  BLOCKCHAIN_EXPLORERS_OVERRIDES_STORAGE_KEY,
  NEVER_AUTOLOCK_VALUE,
  TEZOS_CHAINS_SPECS_STORAGE_KEY
} from 'lib/constants';
import { DEFAULT_WALLET_AUTOLOCK_TIME } from 'lib/fixed-times';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { type TezosChainSpecs } from 'lib/temple/chains-specs';
import { BlockExplorer, TempleSharedStorageKey, TempleTezosChainId } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { migrate } from './migrator';

migrate([
  {
    name: '1.17.4',
    up: () => {
      const match = (key: string) =>
        /** `no_metadata_${slug}` */
        key.startsWith('no_metadata_') ||
        /** `${Rpc URL}_${Contract address}` // Deprecated cache from class FastRpcClient */
        key.match(/https?:\/\/.*_KT[-a-zA-Z0-9]*$/);

      const keys = new Array(localStorage.length).fill(null).map((_, i) => localStorage.key(i));
      for (const key of keys) {
        if (isNotEmptyString(key) && match(key)) localStorage.removeItem(key);
      }
    }
  },
  {
    name: '1.19.1',
    up: () => localStorage.removeItem('useledgerlive')
  },
  {
    name: '2.0.0',
    up: async () => {
      const rawIsLocked = localStorage.getItem(TempleSharedStorageKey.LockUpEnabled);
      localStorage.removeItem(TempleSharedStorageKey.LockUpEnabled);

      const existingAutoLock = await fetchFromStorage<number>(AUTOLOCK_TIME_STORAGE_KEY);
      if (existingAutoLock !== null) return;
      putToStorage(
        AUTOLOCK_TIME_STORAGE_KEY,
        rawIsLocked === 'true' || rawIsLocked === null ? DEFAULT_WALLET_AUTOLOCK_TIME : NEVER_AUTOLOCK_VALUE
      ).catch(e => console.error(e));
    }
  },
  {
    name: '2.0.1',
    up: () => localStorage.removeItem('onboarding')
  },
  {
    name: '2.0.30',
    up: async () => {
      const removedBlockExplorerIds = ['tzstats-mainnet', 'bcd-mainnet'];

      const tezosChainsSpecs = await fetchFromStorage<OptionalRecord<TezosChainSpecs>>(TEZOS_CHAINS_SPECS_STORAGE_KEY);
      const mainnetSpecs = tezosChainsSpecs?.[TempleTezosChainId.Mainnet];

      if (mainnetSpecs && removedBlockExplorerIds.includes(mainnetSpecs.activeBlockExplorerId ?? '')) {
        await putToStorage<OptionalRecord<TezosChainSpecs>>(TEZOS_CHAINS_SPECS_STORAGE_KEY, {
          ...tezosChainsSpecs,
          [TempleTezosChainId.Mainnet]: {
            ...mainnetSpecs,
            activeBlockExplorerId: 'tzkt-mainnet'
          }
        });
      }

      const blockExplorersOverrides = await fetchFromStorage<
        Partial<Record<TempleChainKind, OptionalRecord<BlockExplorer[]> | undefined>>
      >(BLOCKCHAIN_EXPLORERS_OVERRIDES_STORAGE_KEY);
      const mainnetExplorers = blockExplorersOverrides?.[TempleChainKind.Tezos]?.[TempleTezosChainId.Mainnet];

      const remainingExplorers = mainnetExplorers?.filter(({ id }) => !removedBlockExplorerIds.includes(id));

      if (!remainingExplorers?.length) return;

      const { [TempleTezosChainId.Mainnet]: _mainnetExplorers, ...tezosOverridesWithoutMainnet } =
        blockExplorersOverrides?.[TempleChainKind.Tezos] ?? {};

      await putToStorage<Partial<Record<TempleChainKind, OptionalRecord<BlockExplorer[]> | undefined>>>(
        BLOCKCHAIN_EXPLORERS_OVERRIDES_STORAGE_KEY,
        {
          ...blockExplorersOverrides,
          [TempleChainKind.Tezos]: {
            ...tezosOverridesWithoutMainnet,
            [TempleTezosChainId.Mainnet]: remainingExplorers
          }
        }
      );
    }
  }
]);
