import { useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import constate from 'constate';
import { flushSync } from 'react-dom';

import { fetchBalance } from 'lib/temple/assets';
import {
  useAccount,
  useAllTokensBaseMetadata,
  useChainId,
  useDisplayedFungibleTokens,
  useTezos
} from 'lib/temple/front/index';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';

import { ITokenStatus, ITokenType } from '../repo';

export const [SyncBalancesProvider, useSyncBalances] = constate(() => {
  const [assetSlugsWithUpdatedBalances, setAssetSlugsWithUpdatedBalances] = useState<Record<string, BigNumber>>({});

  const tezos = useTezos();
  const isSyncing = useSyncTokens();
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, publicKeyHash);

  const tokensWithTez = useMemo(
    () => [
      {
        type: ITokenType.Fungible,
        chainId,
        account: publicKeyHash,
        tokenSlug: 'tez',
        status: ITokenStatus.Enabled,
        addedAt: 0
      },
      ...tokens
    ],
    [chainId, publicKeyHash, tokens]
  );

  const chainIdRef = useRef<string>();
  const accountRef = useRef<string>();

  const updateBalances = async () => {
    for (let i = 0; i < tokensWithTez.length; i++) {
      const { tokenSlug } = tokensWithTez[i];

      if (chainIdRef.current !== tokensWithTez[i].chainId || accountRef.current !== tokensWithTez[i].account) break;

      const latestBalance = await fetchBalance(tezos, tokenSlug, allTokensBaseMetadata[tokenSlug], publicKeyHash);

      if (chainIdRef.current !== tokensWithTez[i].chainId || accountRef.current !== tokensWithTez[i].account) break;

      if (
        !assetSlugsWithUpdatedBalances.hasOwnProperty(tokenSlug) ||
        !assetSlugsWithUpdatedBalances[tokenSlug].eq(latestBalance)
      ) {
        flushSync(() => setAssetSlugsWithUpdatedBalances(prevState => ({ ...prevState, [tokenSlug]: latestBalance })));
      }
    }
  };

  useEffect(() => {
    if (chainId !== chainIdRef.current || publicKeyHash !== accountRef.current) {
      setAssetSlugsWithUpdatedBalances({});
    } else if (!isSyncing) {
      updateBalances();
    }

    chainIdRef.current = chainId;
    accountRef.current = publicKeyHash;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, chainId, publicKeyHash]);

  return assetSlugsWithUpdatedBalances;
});
