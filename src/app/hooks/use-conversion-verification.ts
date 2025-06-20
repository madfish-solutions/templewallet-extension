import { useCallback, useEffect, useState } from 'react';

import { isAxiosError } from 'axios';

import { useAppEnv } from 'app/env';
import { fetchConversionInformation, registerWallet } from 'lib/apis/temple';
import {
  CONVERSION_CHECKED_STORAGE_KEY,
  REFERRAL_USER_ID_STORAGE_KEY,
  REFERRAL_WALLET_REGISTERED_STORAGE_KEY
} from 'lib/constants';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { StoredHDAccount, TempleAccountType } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

export const useReferralUserId = () => useStorageVariable<string>(REFERRAL_USER_ID_STORAGE_KEY);

export const useRegisterReferralWalletIfPossible = () => {
  const { accounts } = useTempleClient();
  const [referralUserId, setReferralUserId] = useReferralUserId();
  const [referralWalletRegistered, setReferralWalletRegistered] = useStorageVariable<boolean>(
    REFERRAL_WALLET_REGISTERED_STORAGE_KEY
  );

  const firstHdAccount = useMemoWithCompare(
    () => accounts.find((acc): acc is StoredHDAccount => acc.type === TempleAccountType.HD),
    [accounts]
  );

  return useCallback(async () => {
    if ((referralUserId && referralWalletRegistered) || !firstHdAccount) {
      return referralUserId;
    }

    return registerWallet(firstHdAccount.tezosAddress, firstHdAccount.evmAddress, referralUserId).then(({ userId }) => {
      setReferralUserId(userId);
      setReferralWalletRegistered(true);

      return userId;
    });
  }, [firstHdAccount, referralUserId, referralWalletRegistered, setReferralUserId, setReferralWalletRegistered]);
};

export const useConversionVerification = () => {
  const { fullPage } = useAppEnv();
  const { ready } = useTempleClient();

  const [, setReferralUserId] = useReferralUserId();
  const [conversionChecked, setConversionChecked] = useStorageVariable<boolean>(CONVERSION_CHECKED_STORAGE_KEY);
  const registerReferralWalletIfPossible = useRegisterReferralWalletIfPossible();

  useEffect(() => {
    if (!fullPage && !ready) {
      return;
    }

    if (conversionChecked) {
      registerReferralWalletIfPossible().catch(e => console.error(e));

      return;
    }

    fetchConversionInformation()
      .then(({ userId }) => {
        setReferralUserId(userId);
        setConversionChecked(true);
      })
      .catch(e => {
        console.error(e);
        const responseStatus = isAxiosError(e) ? e.response?.status : undefined;

        if (responseStatus && responseStatus >= 400 && responseStatus < 500) {
          setConversionChecked(true);
        }
      });
  }, [conversionChecked, fullPage, ready, registerReferralWalletIfPossible, setConversionChecked, setReferralUserId]);
};

const useStorageVariable = <T>(key: string) => {
  const [valueFromStorage, putToStorage] = useStorage<T>(key);
  const [localValue, setLocalValue] = useState(valueFromStorage ?? null);

  const setValue = useCallback(
    (newValue: NonNullable<T>) => {
      putToStorage(newValue)
        .then(() => setLocalValue(newValue))
        .catch(e => console.error(e));
    },
    [putToStorage]
  );

  useEffect(() => {
    // Vault.registerWallet function clears async storages, so we should correct the value when it turns into null
    if (valueFromStorage != null && valueFromStorage !== localValue) {
      setLocalValue(valueFromStorage);
    } else if (valueFromStorage === null && localValue !== null) {
      putToStorage(localValue);
    }
  }, [localValue, putToStorage, valueFromStorage]);

  return [localValue, setValue] as const;
};
