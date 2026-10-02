import { fetchFromStorage, onStorageChanged } from 'lib/storage';

const PERSIST_ROOT_KEY = 'persist:temple-root';

interface NotificationsSlice {
  isAccountNotificationsEnabled?: boolean;
}

interface PersistedRoot {
  notifications?: NotificationsSlice | string;
}

const parseSlice = <T>(slice: T | string | undefined): T | undefined => {
  if (typeof slice !== 'string') {
    return slice;
  }

  try {
    return JSON.parse(slice) as T;
  } catch {
    return undefined;
  }
};

const readEnabled = (root: PersistedRoot | null) =>
  parseSlice(root?.notifications)?.isAccountNotificationsEnabled !== false;

export const isAccountNotificationsPopupEnabled = async () => {
  const root = await fetchFromStorage<PersistedRoot>(PERSIST_ROOT_KEY).catch(() => null);

  return readEnabled(root);
};

export const subscribeAccountNotificationsEnabled = (onChange: (enabled: boolean) => void) =>
  onStorageChanged<PersistedRoot | null>(PERSIST_ROOT_KEY, root => onChange(readEnabled(root)));
