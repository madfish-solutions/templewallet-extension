import { useCallback, useEffect, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import useForceUpdate from 'use-force-update';

import { dispatch } from 'app/store';
import { loadGasBalanceActions, loadAssetsBalancesActions } from 'app/store/balances/actions';
import { useBalancesErrorSelector, useBalancesLoadingSelector } from 'app/store/balances/selectors';
import { isKnownChainId } from 'lib/apis/tzkt';
import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useTezosNetwork, useAllTezosChains } from 'temple/front';

import { TempleTezosBlockSubscription } from './tezos-block-subscription';
import { TempleTzktSubscription } from './tzkt-subscription';

export const useBalancesLoading = (publicKeyHash: string) => {
  const forceUpdate = useForceUpdate();

  const { chainId, rpcBaseURL } = useTezosNetwork();

  const allTezosNetworks = useAllTezosChains();

  const knownNetworks = useMemoWithCompare(
    () =>
      Object.values(allTezosNetworks)
        .map(({ chainId, rpcBaseURL }) => (isKnownChainId(chainId) ? { chainId, rpcBaseURL } : null))
        .filter(isTruthy),
    [allTezosNetworks]
  );

  const isLoading = useBalancesLoadingSelector(publicKeyHash, chainId);
  const isLoadingRef = useRef(false);

  useDidUpdate(() => {
    // Persisted `isLoading` value might be `true`.
    // Using initial `false` & only updating on further changes.
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const getIsLoading = useCallback(() => isLoadingRef.current, []);

  const storedError = useBalancesErrorSelector(publicKeyHash, chainId);
  const isStoredError = isDefined(storedError);

  const tzktSubscription = useMemo(
    () =>
      isKnownChainId(chainId) ? new TempleTzktSubscription(chainId, publicKeyHash, getIsLoading, forceUpdate) : null,
    [chainId, publicKeyHash, getIsLoading, forceUpdate]
  );
  useEffect(() => () => void tzktSubscription?.destroy(), [tzktSubscription]);

  //
  //

  const dispatchLoadGasBalanceAction = useCallback(() => {
    if (isKnownChainId(chainId) && !getIsLoading()) {
      dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, getIsLoading]);

  useEffect(dispatchLoadGasBalanceAction, [dispatchLoadGasBalanceAction]);

  const withBlockSubscriptionForGas =
    isKnownChainId(chainId) && (!tzktSubscription?.subscribedToGasUpdates || isStoredError === true);

  useEffect(() => {
    const blockSubscriptionForGas = withBlockSubscriptionForGas
      ? new TempleTezosBlockSubscription(rpcBaseURL, dispatchLoadGasBalanceAction)
      : null;

    return () => void blockSubscriptionForGas?.destroy();
  }, [dispatchLoadGasBalanceAction, withBlockSubscriptionForGas, rpcBaseURL]);

  //

  const dispatchLoadAssetsBalancesActions = useCallback(() => {
    if (isKnownChainId(chainId) && !getIsLoading()) {
      dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, getIsLoading]);

  useEffect(dispatchLoadAssetsBalancesActions, [dispatchLoadAssetsBalancesActions]);

  const withBlockSubscriptionForAssets =
    isKnownChainId(chainId) && (!tzktSubscription?.subscribedToTokensUpdates || isStoredError === true);

  useEffect(() => {
    const blockSubscriptionForAssets = withBlockSubscriptionForAssets
      ? new TempleTezosBlockSubscription(rpcBaseURL, dispatchLoadAssetsBalancesActions)
      : null;

    return () => void blockSubscriptionForAssets?.destroy();
  }, [dispatchLoadAssetsBalancesActions, withBlockSubscriptionForAssets, rpcBaseURL]);

  //
  //
};
