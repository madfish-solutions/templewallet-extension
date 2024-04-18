import React, { memo, useCallback, useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { dispatch } from 'app/store';
import { loadGasBalanceActions, loadAssetsBalancesActions } from 'app/store/balances/actions';
import { useBalancesErrorSelector, useBalancesLoadingSelector } from 'app/store/balances/selectors';
import { TzktApiChainId, isKnownChainId } from 'lib/apis/tzkt';
import { useDidUpdate, useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { useEnabledTezosChains, useOnTezosBlock } from 'temple/front';

import { useTzktSubscription } from './use-tzkt-subscription';

export const AppTezosBalancesLoading = memo<{ publicKeyHash: string }>(({ publicKeyHash }) => {
  const tezosChains = useEnabledTezosChains();

  const knownTezosNetworks = useMemoWithCompare(
    () =>
      tezosChains
        .map(({ chainId, rpcBaseURL }) => (isKnownChainId(chainId) ? { chainId, rpcBaseURL } : null))
        .filter(isTruthy),
    [tezosChains]
  );

  return (
    <>
      {knownTezosNetworks.map(network => (
        <BalancesLoadingForTezosNetwork
          key={network.chainId}
          publicKeyHash={publicKeyHash}
          chainId={network.chainId}
          rpcBaseURL={network.rpcBaseURL}
        />
      ))}
    </>
  );
});

const BalancesLoadingForTezosNetwork = memo<{ publicKeyHash: string; chainId: TzktApiChainId; rpcBaseURL: string }>(
  ({ publicKeyHash, chainId, rpcBaseURL }) => {
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

    const tzktSubscription = useTzktSubscription(publicKeyHash, chainId, getIsLoading);

    // Gas

    const dispatchLoadGasBalanceAction = useCallback(() => {
      if (!isLoadingRef.current) {
        dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
      }
    }, [publicKeyHash, chainId, isLoadingRef]);

    useEffect(dispatchLoadGasBalanceAction, [dispatchLoadGasBalanceAction]);

    const withBlockSubscriptionForGas = !tzktSubscription.subscribedToGasUpdates || isStoredError === true;

    useOnTezosBlock(rpcBaseURL, dispatchLoadGasBalanceAction, !withBlockSubscriptionForGas);

    // Assets

    const dispatchLoadAssetsBalancesActions = useCallback(() => {
      if (!isLoadingRef.current) {
        dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
      }
    }, [publicKeyHash, chainId, isLoadingRef]);

    useEffect(dispatchLoadAssetsBalancesActions, [dispatchLoadAssetsBalancesActions]);

    const withBlockSubscriptionForAssets = !tzktSubscription.subscribedToTokensUpdates || isStoredError === true;

    useOnTezosBlock(rpcBaseURL, dispatchLoadAssetsBalancesActions, !withBlockSubscriptionForAssets);

    return null;
  }
);
