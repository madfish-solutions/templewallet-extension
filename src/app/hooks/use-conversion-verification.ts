import { useEffect } from 'react';

import { isAxiosError } from 'axios';

import { useAppEnv } from 'app/env';
import { fetchConversionAccount, fetchConversionInformation, registerWallet } from 'lib/apis/temple';
import { CONVERSION_CHECKED_STORAGE_KEY, REFERRAL_WALLET_REGISTERED_STORAGE_KEY } from 'lib/constants';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { StoredHDAccount, TempleAccountType } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

export const useConversionVerification = () => {
  const { fullPage } = useAppEnv();
  const { accounts, ready } = useTempleClient();

  const [conversionChecked, setConversionChecked] = useStorage<boolean>(CONVERSION_CHECKED_STORAGE_KEY);
  const [referralWalletRegistered, setReferralWalletRegistered] = useStorage<boolean>(
    REFERRAL_WALLET_REGISTERED_STORAGE_KEY
  );
  const firstHdAccount = useMemoWithCompare(
    () => accounts.find((acc): acc is StoredHDAccount => acc.type === TempleAccountType.HD),
    [accounts]
  );

  useEffect(() => {
    if (!fullPage && !ready) {
      return;
    }

    if (!conversionChecked) {
      fetchConversionInformation()
        .then(() => setConversionChecked(true))
        .catch(e => {
          console.error(e);
          const responseStatus = isAxiosError(e) ? e.response?.status : undefined;

          if (responseStatus && responseStatus >= 400 && responseStatus < 500) {
            setConversionChecked(true);
          }
        });
    } else if (referralWalletRegistered) {
      // TODO: use fetched data when it becomes necessary, for example, for referral fees
      fetchConversionAccount().catch(e => console.error(e));
    } else if (firstHdAccount) {
      registerWallet(firstHdAccount.tezosAddress, firstHdAccount.evmAddress)
        .then(() => setReferralWalletRegistered(true))
        .catch(e => console.error(e));
    }
  }, [
    conversionChecked,
    firstHdAccount,
    fullPage,
    ready,
    referralWalletRegistered,
    setConversionChecked,
    setReferralWalletRegistered
  ]);
};
