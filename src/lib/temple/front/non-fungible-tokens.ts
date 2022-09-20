import { useCallback, useEffect, useState } from 'react';

import constate from 'constate';

import { fetchTokens } from 'lib/tzkt/client';

import { TzktAccountToken } from '../../tzkt';
import { useAccount, useChainId } from './ready';

export const [NonFungibleTokensProvider, useNonFungibleTokens] = constate(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const [nfts, setNfts] = useState<Array<TzktAccountToken>>([]);

  const loadNfts = useCallback(
    () => fetchTokens(chainId, publicKeyHash, true).then(nfts => setNfts(nfts)),
    [publicKeyHash, chainId]
  );

  useEffect(() => void loadNfts(), [loadNfts]);

  return {
    nfts,
    setNfts
  };
});
