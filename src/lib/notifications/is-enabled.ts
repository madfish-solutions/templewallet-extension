import { fetchFromStorage, onStorageChanged } from 'lib/storage';

const PERSIST_ROOT_KEY = 'persist:temple-root';

interface NotificationsSlice {
  isAccountNotificationsEnabled?: boolean;
}

interface PersistedRoot {
  notifications?: NotificationsSlice | string;
}

const parseSlice = (slice: NotificationsSlice | string | undefined): NotificationsSlice | undefined => {
  if (typeof slice !== 'string') {
    return slice;
  }

  try {
    const parsed: unknown = JSON.parse(slice);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }

    if (!('isAccountNotificationsEnabled' in parsed)) {
      return {};
    }

    return {
      isAccountNotificationsEnabled:
        typeof parsed.isAccountNotificationsEnabled === 'boolean' ? parsed.isAccountNotificationsEnabled : undefined
    };
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
