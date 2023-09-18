import { isEqual } from 'lodash';

import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSelector } from '../index';

export const useAccountTokensAreLoadingSelector = () => useSelector(state => state.assets.tokens.isLoading);

export const useAccountTokensSelector = (account: string, chainId: string) => {
  const allTokens = useSelector(state => state.assets.tokens.data);

  return useMemoWithCompare(
    () => allTokens.filter(t => t.account === account && t.chainId === chainId),
    [allTokens],
    isEqual
  );
};
