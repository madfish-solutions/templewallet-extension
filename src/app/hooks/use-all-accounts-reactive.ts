import { useEffect, useRef } from 'react';

import { isEqual } from 'lodash';

import { navigate } from 'lib/woozie';
import { useAllAccounts, useChangeAccount } from 'temple/front';

export const useAllAccountsReactiveOnAddition = () => {
  const allAccounts = useAllAccounts();
  const setAccountId = useChangeAccount();

  const prevAccountsIds = useRef(allAccounts.map(a => a.id));

  useEffect(() => {
    const prevAccLength = prevAccountsIds.current.length;

    const accLength = allAccounts.length;
    const newAccountsIds = allAccounts.map(a => a.id);
    if (
      prevAccLength < accLength ||
      (prevAccLength === accLength && !isEqual(prevAccountsIds.current, newAccountsIds))
    ) {
      setAccountId(allAccounts[accLength - 1].id);
      navigate('/');
    }
    prevAccountsIds.current = newAccountsIds;
  }, [allAccounts, setAccountId]);

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
