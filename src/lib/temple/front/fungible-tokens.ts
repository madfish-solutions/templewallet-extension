import { useCallback, useEffect, useState } from 'react';

import constate from 'constate';

import { fetchTokens } from 'lib/tzkt/client';

import { TzktAccountToken } from '../../tzkt';
import { useAccount, useChainId } from './ready';

export const [FungibleTokensProvider, useFungibleTokens] = constate(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const [tokens, setTokens] = useState<Array<TzktAccountToken>>([]);

  const loadTokens = useCallback(
    () => fetchTokens(chainId, publicKeyHash, false).then(tokens => setTokens(tokens)),
    [publicKeyHash, chainId]
  );

  useEffect(() => void loadTokens(), [loadTokens]);

  return {
    tokens,
    setTokens
  };
});
