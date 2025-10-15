import { isNotEmptyString } from '@rnw-community/shared';

import { AUTOLOCK_TIME_STORAGE_KEY, NEVER_AUTOLOCK_VALUE } from 'lib/constants';
import { DEFAULT_WALLET_AUTOLOCK_TIME } from 'lib/fixed-times';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { TempleSharedStorageKey } from 'lib/temple/types';

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
  }
]);
