import { useMemo } from 'react';

import { useStorage, fetchFromStorage } from 'lib/temple/front';

const LOCK_UP_STORAGE_KEY = 'lock_up';
const DEFAULT_LOCK_UP = true;

export async function getLockUpEnabled() {
  const value = await fetchFromStorage(LOCK_UP_STORAGE_KEY);
  return typeof value === 'boolean' ? value : DEFAULT_LOCK_UP;
}

export function useLockUp() {
  /*
    We used to use window.localStorage here.
    Thus, here is also a migration code.
  */

  const _stored = localStorage.getItem(LOCK_UP_STORAGE_KEY);
  const defValue = _stored == null ? DEFAULT_LOCK_UP : (JSON.parse(_stored) as boolean);

  const [value, setValue] = useStorage<boolean>(LOCK_UP_STORAGE_KEY, defValue);

  const setLockUp = useMemo(
    () => (value: boolean) => {
      localStorage.removeItem(LOCK_UP_STORAGE_KEY);

      return setValue(value);
    },
    [setValue]
  );

  return [value, setLockUp] as const;
}
