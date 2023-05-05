import { useState } from 'react';

const DEPRECATED_KEYS = [
  'no_metadata_' // `no_metadata_${slug}`
];

// TODO: reuse in other places (eg. saving.ts & popup-mode/index.ts)
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getItem(key);

      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);

      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const getItem = (key: string) => {
  if (DEPRECATED_KEYS.some(k => key.startsWith(k))) throw new Error(`Storage key ${key} is deprecated`);

  return localStorage.getItem(key);
};
