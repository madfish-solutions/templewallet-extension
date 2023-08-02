import { isNotEmptyString } from '@rnw-community/shared';

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
  }
]);
