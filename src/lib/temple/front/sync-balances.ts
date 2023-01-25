import { useEffect, useMemo, useRef } from 'react';

import BigNumber from 'bignumber.js';
import constate from 'constate';
import { flushSync } from 'react-dom';

import { isTezAsset, fetchBalance, fetchBalanceFromTzkt } from 'lib/temple/assets';
import {
  useAccount,
  useAllTokensBaseMetadata,
  useChainId,
  useDisplayedFungibleTokens,
  useExplorerBaseUrls,
  useTezos
} from 'lib/temple/front/index';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { AssetMetadata } from 'lib/temple/metadata';
import { ITokenStatus, ITokenType } from 'lib/temple/repo';
import { useSafeState, useStopper } from 'lib/ui/hooks';

export const [SyncBalancesProvider, useSyncBalances] = constate(() => {
  const [assetSlugsWithUpdatedBalances, setAssetSlugsWithUpdatedBalances] = useSafeState<Record<string, BigNumber>>({});

  const tezos = useTezos();
  const isSyncing = useSyncTokens();
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;
  const tzktApiUrl = useExplorerBaseUrls().api;
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

  const { stop: stopUpdate, stopAndBuildChecker } = useStopper();

  const updateBalancesFromChain = async (shouldStop: () => boolean) => {
    for (const { tokenSlug } of tokensWithTez) {
      const tokenMetadata: AssetMetadata | undefined = allTokensBaseMetadata[tokenSlug];

      if (tokenMetadata == null && isTezAsset(tokenSlug) === false) continue;

      const latestBalance = await fetchBalance(tezos, tokenSlug, publicKeyHash, tokenMetadata);

      if (shouldStop()) return;

      const currentBalance: BigNumber | undefined = assetSlugsWithUpdatedBalances[tokenSlug];
      if (!currentBalance || !currentBalance.eq(latestBalance)) {
        flushSync(() => setAssetSlugsWithUpdatedBalances(prevState => ({ ...prevState, [tokenSlug]: latestBalance })));
      }
    }
  };

  useEffect(() => {
    if (chainId !== chainIdRef.current || publicKeyHash !== accountRef.current) {
      stopUpdate();
      setAssetSlugsWithUpdatedBalances({});
    } else if (isSyncing === false) {
      if (tzktApiUrl !== undefined) {
        fetchBalanceFromTzkt(tzktApiUrl, publicKeyHash).then(balances => setAssetSlugsWithUpdatedBalances(balances));
      } else {
        updateBalancesFromChain(stopAndBuildChecker());
      }
    }

    chainIdRef.current = chainId;
    accountRef.current = publicKeyHash;

    return stopUpdate;
  }, [isSyncing, chainId, publicKeyHash]);

  return assetSlugsWithUpdatedBalances;
});
