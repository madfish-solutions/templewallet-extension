import { useCallback, useEffect, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import useForceUpdate from 'use-force-update';

import { dispatch } from 'app/store';
import { loadGasBalanceActions, loadAssetsBalancesActions } from 'app/store/balances/actions';
import { useBalancesErrorSelector, useBalancesLoadingSelector } from 'app/store/balances/selectors';
import { isKnownChainId } from 'lib/apis/tzkt';
import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useTezosNetwork, useOnTezosBlock, useAllTezosChains } from 'temple/front';
import { TempleTzktSubscription } from 'temple/tzkt-subscription';

export const useBalancesLoading = (publicKeyHash: string) => {
  const { chainId, rpcBaseURL } = useTezosNetwork();

  const allTezosNetworks = useAllTezosChains();

  const networks = useMemoWithCompare(
    () =>
      Object.values(allTezosNetworks)
        .map(({ chainId, rpcBaseURL }) => (isKnownChainId(chainId) ? { chainId, rpcBaseURL } : null))
        .filter(isTruthy),
    [allTezosNetworks]
  );

  const isLoading = useBalancesLoadingSelector(publicKeyHash, chainId);
  const isLoadingRef = useRef(false);
  const forceUpdate = useForceUpdate();

  useDidUpdate(() => {
    // Persisted `isLoading` value might be `true`.
    // Using initial `false` & only updating on further changes.
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const storedError = useBalancesErrorSelector(publicKeyHash, chainId);
  const isStoredError = isDefined(storedError);

  const tzktSubscription = useMemo(
    () =>
      isKnownChainId(chainId)
        ? new TempleTzktSubscription(chainId, publicKeyHash, () => isLoadingRef.current, forceUpdate)
        : null,
    [chainId, publicKeyHash, forceUpdate]
  );
  useEffect(() => () => void tzktSubscription?.cancel(), [tzktSubscription]);

  //
  //

  const dispatchLoadGasBalanceAction = useCallback(() => {
    if (isLoadingRef.current === false && isKnownChainId(chainId)) {
      dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, isLoadingRef]);

  useEffect(dispatchLoadGasBalanceAction, [dispatchLoadGasBalanceAction]);
  useOnTezosBlock(
    rpcBaseURL,
    dispatchLoadGasBalanceAction,
    tzktSubscription?.subscribedToGasUpdates && isStoredError === false
  );

  const dispatchLoadAssetsBalancesActions = useCallback(() => {
    if (isLoadingRef.current === false && isKnownChainId(chainId)) {
      dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, isLoadingRef]);

  useEffect(dispatchLoadAssetsBalancesActions, [dispatchLoadAssetsBalancesActions]);
  useOnTezosBlock(
    rpcBaseURL,
    dispatchLoadAssetsBalancesActions,
    tzktSubscription?.subscribedToTokensUpdates && isStoredError === false
  );
};
