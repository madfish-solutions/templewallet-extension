import { FIREFOX_DATA_CONSENT_STORAGE_KEY } from 'lib/constants';
import { useStorage } from 'lib/temple/front';

interface FirefoxDataConsent {
  hasResponded: boolean;
  agreed: boolean;
}

export const useFirefoxDataConsent = () =>
  useStorage<FirefoxDataConsent | null>(FIREFOX_DATA_CONSENT_STORAGE_KEY, null);
