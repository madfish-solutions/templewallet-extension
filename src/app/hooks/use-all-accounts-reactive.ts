import { useEffect, useRef } from 'react';

import { useAllAccounts, useSetAccountId } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

export const useAllAccountsReactiveOnAddition = () => {
  const allAccounts = useAllAccounts();
  const setAccountId = useSetAccountId();

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
  // const allAccounts = useRelevantAccounts(tezosChainId);
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
