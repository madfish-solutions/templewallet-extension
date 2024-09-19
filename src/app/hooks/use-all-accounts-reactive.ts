import { useEffect, useRef } from 'react';

import { difference } from 'lodash';

import { navigate } from 'lib/woozie';
import { useAllAccounts, useChangeAccount } from 'temple/front';

export const useAllAccountsReactiveOnAddition = (shouldRedirectToHome = true) => {
  const allAccounts = useAllAccounts();
  const setAccountId = useChangeAccount();

  const prevAccountsIds = useRef(allAccounts.map(a => a.id));

  useEffect(() => {
    const newAccountsIds = allAccounts.map(a => a.id);
    if (difference(newAccountsIds, prevAccountsIds.current).length > 0) {
      setAccountId(allAccounts[allAccounts.length - 1].id);
      if (shouldRedirectToHome) {
        navigate('/');
      }
    }
    prevAccountsIds.current = newAccountsIds;
  }, [allAccounts, setAccountId, shouldRedirectToHome]);

  return allAccounts;
};

export const useAllAccountsReactiveOnRemoval = () => {
  const allAccounts = useAllAccounts();

  const prevAccLengthRef = useRef(allAccounts.length);

  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current > accLength) {
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts]);
};
