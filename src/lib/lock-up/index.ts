const STORAGE_KEY = 'lock_up';
const DEFAULT_VALUE = true;

export const getIsLockUpEnabled = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? stored === 'true' : DEFAULT_VALUE;
};

export const saveIsLockUpEnabled = (value: boolean) => {
  localStorage.setItem(STORAGE_KEY, String(value));
};
