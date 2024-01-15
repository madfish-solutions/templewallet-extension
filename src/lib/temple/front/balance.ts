import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';

import { subscribeToActions } from 'app/store';
import { loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
import { useAllBalancesSelector } from 'app/store/balances/selectors';
import { isKnownChainId } from 'lib/apis/tzkt';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { fetchBalance as fetchBalanceFromBlockchain, getBalanceSWRKey } from 'lib/balances';
import { getKeyForBalancesRecord } from 'lib/balances/utils';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { useAssetMetadata } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { atomsToTokens, michelEncoder, loadFastRpcClient } from 'lib/temple/helpers';

import { useCustomChainId, useTezos, ReactiveTezosToolkit } from './ready';

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

export function useBalance(assetSlug: string, address: string, opts: UseBalanceOptions = {}) {
  const dispatch = useDispatch();
  const nativeTezos = useTezos();
  const nativeRpcUrl = useMemo(() => nativeTezos.rpc.getRpcUrl(), [nativeTezos]);
  const { suspense = true, networkRpc = nativeRpcUrl, displayed = true, initial: fallbackData } = opts;
  const chainId = useCustomChainId(networkRpc, opts.suspense);
  const assetMetadata = useAssetMetadata(assetSlug);
  const allBalances = useAllBalancesSelector();

  const convertRawBalance = useCallback(
    (rawBalance?: string) =>
      rawBalance ? atomsToTokens(new BigNumber(rawBalance), assetMetadata?.decimals ?? 0) : undefined,
    [assetMetadata?.decimals]
  );

  const tezos = useMemo(() => {
    if (opts.networkRpc) {
      const rpc = opts.networkRpc;
      const t = new ReactiveTezosToolkit(loadFastRpcClient(rpc), rpc);
      t.setPackerProvider(michelEncoder);
      return t;
    }
    return nativeTezos;
  }, [opts.networkRpc, nativeTezos]);

  const fetchBalanceLocal = useCallback(async () => {
    const freshChainId = chainId ?? (await tezos.rpc.getChainId());

    if (!assetMetadata) {
      throw new Error('Metadata missing, when fetching balance');
    }

    if (!isKnownChainId(freshChainId) || assetSlug === TEZ_TOKEN_SLUG) {
      return fetchBalanceFromBlockchain(tezos, assetSlug, address, assetMetadata);
    }

    const publicKeyHashWithChainId = getKeyForBalancesRecord(address, freshChainId);
    const accountBalances = allBalances[publicKeyHashWithChainId]?.data ?? {};
    const balancesAreEmpty = Object.keys(accountBalances).length === 0;
    const balanceRawError = allBalances[publicKeyHashWithChainId]?.error;
    const balanceLoading = allBalances[publicKeyHashWithChainId]?.isLoading;
    const alreadyFetchedBalance = convertRawBalance(accountBalances[assetSlug]);

    if (alreadyFetchedBalance) {
      return alreadyFetchedBalance;
    }

    if (balanceRawError) {
      throw new Error(balanceRawError);
    }

    if (!balanceLoading && balancesAreEmpty) {
      dispatch(loadTokensBalancesFromTzktAction.submit({ publicKeyHash: address, chainId: freshChainId }));
    }

    return new Promise<BigNumber>((res, rej) => {
      const unsubscribe = subscribeToActions(action => {
        switch (action.type) {
          case loadTokensBalancesFromTzktAction.success.type:
            const successAction = action as ReturnType<typeof loadTokensBalancesFromTzktAction.success>;
            const { publicKeyHash: newBalancesAddress, chainId: newBalancesChainId } = successAction.payload;
            if (newBalancesAddress === address && newBalancesChainId === freshChainId) {
              res(convertRawBalance(successAction.payload.balances[assetSlug]) ?? new BigNumber(0));
              unsubscribe();
            }
            break;
          case loadTokensBalancesFromTzktAction.fail.type:
            const errorAction = action as ReturnType<typeof loadTokensBalancesFromTzktAction.fail>;
            const { publicKeyHash: failedBalancesAddress, chainId: failedBalancesChainId } = errorAction.payload;
            if (failedBalancesAddress === address && failedBalancesChainId === freshChainId) {
              rej(new Error(errorAction.payload.error));
              unsubscribe();
            }
        }
      });
    });
  }, [address, allBalances, assetMetadata, assetSlug, chainId, convertRawBalance, dispatch, tezos]);

  const swrResponse = useRetryableSWR(
    displayed ? getBalanceSWRKey(tezos, assetSlug, address) : null,
    fetchBalanceLocal,
    {
      suspense,
      revalidateOnFocus: false,
      dedupingInterval: 20_000,
      fallbackData,
      refreshInterval: isKnownChainId(chainId) ? 1000 : BLOCK_DURATION
    }
  );

  const updateBalance = useCallback(async () => {
    const newBalance = await fetchBalanceLocal();
    swrResponse.mutate(newBalance);

    return newBalance;
  }, [fetchBalanceLocal, swrResponse]);

  return useMemo(
    () => ({
      ...swrResponse,
      updateBalance
    }),
    [swrResponse, updateBalance]
  );
}
