import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';

import { subscribeToActions } from 'app/store';
import { loadNativeTokenBalanceFromTzktAction, loadTokensBalancesFromTzktAction } from 'app/store/balances/actions';
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

    if (!isKnownChainId(freshChainId)) {
      if (assetMetadata) return fetchBalanceFromBlockchain(tezos, assetSlug, address, assetMetadata);
      throw new Error('Metadata missing, when fetching balance');
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
      const actionType =
        assetSlug === TEZ_TOKEN_SLUG ? loadNativeTokenBalanceFromTzktAction : loadTokensBalancesFromTzktAction;
      dispatch(actionType.submit({ publicKeyHash: address, chainId: freshChainId }));
    }

    return new Promise<BigNumber>((res, rej) => {
      const unsubscribe = subscribeToActions((action: unknown) => {
        if (typeof action !== 'object') {
          return;
        }

        const typedAction = action as Record<string, any> | null;
        const actionMayBeRelatedToThisRequest =
          typedAction?.payload?.publicKeyHash === address && typedAction?.payload?.chainId === freshChainId;

        if (!actionMayBeRelatedToThisRequest) {
          return;
        }

        switch (typedAction?.type) {
          case loadTokensBalancesFromTzktAction.success.type:
            res(convertRawBalance(typedAction.payload.balances[assetSlug]) ?? new BigNumber(0));
            unsubscribe();
            break;
          case loadNativeTokenBalanceFromTzktAction.success.type:
            if (assetSlug === TEZ_TOKEN_SLUG) {
              res(convertRawBalance(typedAction.payload.balance)!);
              unsubscribe();
            }
            break;
          case loadTokensBalancesFromTzktAction.fail.type:
          case loadNativeTokenBalanceFromTzktAction.fail.type:
            rej(new Error(typedAction.payload.error));
            unsubscribe();
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
