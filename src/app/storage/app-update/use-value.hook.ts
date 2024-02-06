import { useStorage } from 'lib/temple/front';

import { AppUpdateDetails, storageKey } from './index';

export const useStoredAppUpdateDetails = () => useStorage<AppUpdateDetails>(storageKey);
