import { fetchFromStorage } from 'lib/storage';

export const MISES_INSTALL_ENABLED_ADS_STORAGE_KEY = 'MISES_ACCEPT_TOS';

export const getMisesInstallEnabledAds = () =>
  fetchFromStorage<'true'>(MISES_INSTALL_ENABLED_ADS_STORAGE_KEY).then(r => r === 'true' || r === true);
