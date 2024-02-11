import { useCallback, useEffect, useRef } from 'react';

import { noop } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadGasBalanceActions, loadAssetsBalancesActions, putTokensBalancesAction } from 'app/store/balances/actions';
import { useBalancesLoadingSelector } from 'app/store/balances/selectors';
import { fixBalances } from 'app/store/balances/utils';
import {
  TzktSubscriptionChannel,
  TzktSubscriptionMethod,
  TzktSubscriptionStateMessageType,
  TzktAccountsSubscriptionMessage,
  TzktTokenBalancesSubscriptionMessage,
  TzktAccountType
} from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';
import { useAccount, useChainId, useOnBlock, useTzktConnection } from 'lib/temple/front';

export const useBalancesLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const isLoading = useBalancesLoadingSelector(publicKeyHash, chainId);
  const isLoadingRef = useRef(false);
  isLoadingRef.current = isLoading;

  const { connection, connectionReady } = useTzktConnection();

  const dispatch = useDispatch();

  const tokenBalancesListener = useCallback(
    (msg: TzktTokenBalancesSubscriptionMessage) => {
      if (isLoadingRef.current) return;

      switch (msg.type) {
        case TzktSubscriptionStateMessageType.Reorg:
          dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
          break;
        case TzktSubscriptionStateMessageType.Data:
          const balances: StringRecord = {};
          msg.data.forEach(({ account, token, balance }) => {
            if (account.address !== publicKeyHash) return;

            balances[toTokenSlug(token.contract.address, token.tokenId)] = balance;
          });
          fixBalances(balances);
          if (Object.keys(balances).length > 0) {
            dispatch(putTokensBalancesAction({ publicKeyHash, chainId, balances }));
          }
          break;
      }
    },
    [publicKeyHash, chainId, dispatch]
  );

  const accountsListener = useCallback(
    (msg: TzktAccountsSubscriptionMessage) => {
      if (isLoadingRef.current) return;

      switch (msg.type) {
        case TzktSubscriptionStateMessageType.Reorg:
          dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
          break;
        case TzktSubscriptionStateMessageType.Data:
          const matchingAccount = msg.data.find(acc => acc.address === publicKeyHash);
          if (
            matchingAccount?.type === TzktAccountType.Contract ||
            matchingAccount?.type === TzktAccountType.Delegate ||
            matchingAccount?.type === TzktAccountType.User
          ) {
            dispatch(
              loadGasBalanceActions.success({
                publicKeyHash,
                chainId,
                balance: matchingAccount.balance.toFixed()
              })
            );
          } else if (matchingAccount) {
            dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
          }
          break;
      }
    },
    [publicKeyHash, chainId, dispatch]
  );

  useEffect(() => {
    if (connection && connectionReady) {
      connection.on(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
      connection.on(TzktSubscriptionChannel.Accounts, accountsListener);

      Promise.all([
        connection.invoke(TzktSubscriptionMethod.SubscribeToAccounts, { addresses: [publicKeyHash] }),
        connection.invoke(TzktSubscriptionMethod.SubscribeToTokenBalances, { account: publicKeyHash })
      ]).catch(e => console.error(e));

      return () => {
        connection.off(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
        connection.off(TzktSubscriptionChannel.Accounts, accountsListener);
      };
    }

    return noop;
  }, [accountsListener, tokenBalancesListener, connection, connectionReady, publicKeyHash]);

  const dispatchLoadBalancesActions = useCallback(() => {
    if (isLoadingRef.current === false) {
      dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
      dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, dispatch]);

  useEffect(dispatchLoadBalancesActions, [dispatchLoadBalancesActions]);
  useOnBlock(dispatchLoadBalancesActions);
};
