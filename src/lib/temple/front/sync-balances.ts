import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const isSync = useSyncTokens();
  const chainId = useChainId(true)!;
  const { publicKeyHash: account } = useAccount();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, account);

  const tokensWithTez = useMemo(
    () => [
      {
        type: ITokenType.Fungible,
        chainId,
        account,
        tokenSlug: 'tez',
        status: ITokenStatus.Enabled,
        addedAt: 0
      },
      ...tokens
    ],
    [chainId, account, tokens]
  );

  const chainIdRef = useRef<string>();
  const accountRef = useRef<string>();

  useEffect(() => void (chainIdRef.current = chainId), [chainId]);
  useEffect(() => void (accountRef.current = account), [account]);

  const updateBalances = useCallback(async () => {
    for (let i = 0; i < tokensWithTez.length; i++) {
      const { tokenSlug } = tokensWithTez[i];

      const shouldLoad =
        chainIdRef.current === tokensWithTez[i].chainId && accountRef.current === tokensWithTez[i].account;

      if (!shouldLoad) break;

      const latestBalance = await fetchBalance(tezos, tokenSlug, allTokensBaseMetadata[tokenSlug], account);

      if (!shouldLoad) break;

      if (i === 0) {
        flushSync(() => setAssetSlugsWithUpdatedBalances({ [tokenSlug]: latestBalance }));
      } else {
        flushSync(() => setAssetSlugsWithUpdatedBalances(prevState => ({ ...prevState, [tokenSlug]: latestBalance })));
      }
    }
  }, [account, allTokensBaseMetadata, tokensWithTez, tezos]);

  useEffect(() => {
    if (isSync) {
      setAssetSlugsWithUpdatedBalances({});
    } else {
      updateBalances();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSync]);

  return assetSlugsWithUpdatedBalances;
});
