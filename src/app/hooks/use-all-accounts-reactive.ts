import { useEffect, useRef } from 'react';

import { navigate } from 'lib/woozie';
import { useAllAccounts, useChangeAccount } from 'temple/front';

export const useAllAccountsReactiveOnAddition = () => {
  const allAccounts = useAllAccounts();
  const setAccountId = useChangeAccount();

  const prevAccLengthRef = useRef(allAccounts.length);

  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountId(allAccounts[accLength - 1].id);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
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
