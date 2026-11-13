import { isAxiosError } from 'axios';

import { useAppEnv } from 'app/env';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { fetchConversionAccount, fetchConversionInformation, registerWallet } from 'lib/apis/temple';
import { CONVERSION_CHECKED_STORAGE_KEY, REFERRAL_WALLET_REGISTERED_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';

type SessionIdentity = readonly [string | null, string | null];

export type ConversionSession =
  | { kind: 'unavailable' }
  | { kind: 'pending' }
  | { kind: 'failed'; error: unknown }
  | { kind: 'ready'; identity: SessionIdentity };

function isMissingSession(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const body: unknown = error.response?.data;
  return (
    error.response?.status === 401 ||
    (error.response?.status === 400 &&
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      body.message === 'User ID cookie is not set')
  );
}

/** Shares page-bootstrap readiness. Reload the window to retry a failed initialization. */
export const useConversionVerification = (): ConversionSession => {
  const { fullPage } = useAppEnv();
  const { accounts, ready } = useTempleClient();
  const { trackEvent } = useAnalytics();
  const firstHdAccount = accounts.find(account => account.type === TempleAccountType.HD);
  const identity: SessionIdentity = [firstHdAccount?.tezosAddress ?? null, firstHdAccount?.evmAddress ?? null];
  const enabled = fullPage || ready;

  const { data, error, isValidating } = useTypedSWR<boolean, unknown>(
    enabled ? ['conversion-session', ...identity] : null,
    async () => {
      const [checked, registered] = await Promise.all([
        fetchFromStorage<unknown>(CONVERSION_CHECKED_STORAGE_KEY),
        fetchFromStorage<unknown>(REFERRAL_WALLET_REGISTERED_STORAGE_KEY)
      ]);
      if (checked !== true) {
        try {
          await fetchConversionInformation();
        } catch (error) {
          // A new install can have no referral attribution. Rate limits and service errors are not readiness.
          if (!isAxiosError(error) || error.response?.status !== 404) throw error;
        }
        await putToStorage(CONVERSION_CHECKED_STORAGE_KEY, true);
      }

      if (registered === true) {
        try {
          await fetchConversionAccount();
          return true;
        } catch (error) {
          if (!isMissingSession(error)) throw error;
        }
      }
      if (!firstHdAccount) return false;

      await registerWallet(firstHdAccount.tezosAddress, firstHdAccount.evmAddress);
      // A successful registration response alone does not prove the browser accepted its cookie.
      await fetchConversionAccount();
      await putToStorage(REFERRAL_WALLET_REGISTERED_STORAGE_KEY, true);
      trackEvent('ReferralSetupCompleted', AnalyticsEventCategory.FormSubmitSuccess);
      return true;
    },
    {
      suspense: false,
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      onError: error => console.error(error)
    }
  );

  if (!enabled) return { kind: 'unavailable' };
  if (error !== undefined) return { kind: 'failed', error };
  if (isValidating || data === undefined) return { kind: 'pending' };
  return data ? { kind: 'ready', identity } : { kind: 'unavailable' };
};
