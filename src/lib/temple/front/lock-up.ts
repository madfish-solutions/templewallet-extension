import { useMemo } from 'react';

import { LOCK_UP_STORAGE_KEY, DEFAULT_LOCK_UP } from 'lib/lock-up';

import { useStorage } from './storage';

export function useLockUp() {
  /*
    We used to use window.localStorage here before.
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
