import { useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import constate from 'constate';
import { flushSync } from 'react-dom';

import { isTezAsset, fetchBalance } from 'lib/temple/assets';
import {
  useAccount,
  useAllTokensBaseMetadata,
  useChainId,
  useDisplayedFungibleTokens,
  useTezos
} from 'lib/temple/front/index';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { AssetMetadata } from 'lib/temple/metadata';
import { ITokenStatus, ITokenType } from 'lib/temple/repo';

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

  const chainIdRef = useRef<string>(chainId);
  const accountRef = useRef<string>(publicKeyHash);

  const updateBalances = async () => {
    for (const token of tokensWithTez) {
      const { tokenSlug, chainId: tokenChainId, account: tokenAccount } = token;

      if (chainIdRef.current !== tokenChainId || accountRef.current !== tokenAccount) break;

      const tokenMetadata: AssetMetadata | undefined = allTokensBaseMetadata[tokenSlug];

      if (tokenMetadata == null && isTezAsset(tokenSlug) === false) continue;

      const latestBalance = await fetchBalance(tezos, tokenSlug, publicKeyHash, tokenMetadata);

      if (chainIdRef.current !== tokenChainId || accountRef.current !== tokenAccount) break;

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
    } else if (isSyncing === false) {
      updateBalances();
    }

    chainIdRef.current = chainId;
    accountRef.current = publicKeyHash;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing, chainId, publicKeyHash]);

  return assetSlugsWithUpdatedBalances;
});
