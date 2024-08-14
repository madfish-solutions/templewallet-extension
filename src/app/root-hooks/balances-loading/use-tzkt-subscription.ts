import { useCallback, useEffect, useState } from 'react';

import { dispatch } from 'app/store';
import {
  loadGasBalanceActions,
  loadAssetsBalancesActions,
  putTokensBalancesAction
} from 'app/store/tezos/balances/actions';
import { fixBalances } from 'app/store/tezos/balances/utils';
import {
  TzktSubscriptionChannel,
  TzktSubscriptionMethod,
  TzktSubscriptionStateMessageType,
  TzktAccountsSubscriptionMessage,
  TzktTokenBalancesSubscriptionMessage,
  TzktAccountType,
  calcTzktAccountSpendableTezBalance,
  TzktApiChainId
} from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';

import { useTzktConnection } from './use-tzkt-connection';

export const useTzktSubscription = (publicKeyHash: string, chainId: TzktApiChainId, getIsLoading: () => boolean) => {
  const { connection, connectionReady } = useTzktConnection(chainId);

  const [tokensSubscriptionConfirmed, setTokensSubscriptionConfirmed] = useState(false);
  const [accountsSubscriptionConfirmed, setAccountsSubscriptionConfirmed] = useState(false);

  const tokenBalancesListener = useCallback(
    (msg: TzktTokenBalancesSubscriptionMessage) => {
      const skipDispatch = getIsLoading();

      switch (msg.type) {
        case TzktSubscriptionStateMessageType.Reorg:
          if (skipDispatch) return;
          dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
          break;
        case TzktSubscriptionStateMessageType.Data:
          if (skipDispatch) return;
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
        default:
          setTokensSubscriptionConfirmed(true);
      }
    },
    [publicKeyHash, chainId, getIsLoading]
  );

  const accountsListener = useCallback(
    (msg: TzktAccountsSubscriptionMessage) => {
      const skipDispatch = getIsLoading();

      switch (msg.type) {
        case TzktSubscriptionStateMessageType.Reorg:
          if (skipDispatch) return;
          dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
          break;
        case TzktSubscriptionStateMessageType.Data:
          if (skipDispatch) return;
          const matchingAccount = msg.data.find(acc => acc.address === publicKeyHash);
          if (
            matchingAccount?.type === TzktAccountType.Contract ||
            matchingAccount?.type === TzktAccountType.Delegate ||
            matchingAccount?.type === TzktAccountType.User
          ) {
            const balance = calcTzktAccountSpendableTezBalance(matchingAccount);

            dispatch(
              loadGasBalanceActions.success({
                publicKeyHash,
                chainId,
                balance
              })
            );
          } else if (matchingAccount) {
            dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
          }
          break;
        default:
          setAccountsSubscriptionConfirmed(true);
      }
    },
    [publicKeyHash, chainId, getIsLoading]
  );

  useEffect(() => {
    if (!connection || !connectionReady) return;

    connection.on(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
    connection.on(TzktSubscriptionChannel.Accounts, accountsListener);

    Promise.all([
      connection.invoke(TzktSubscriptionMethod.SubscribeToAccounts, { addresses: [publicKeyHash] }),
      connection.invoke(TzktSubscriptionMethod.SubscribeToTokenBalances, { account: publicKeyHash })
    ]).catch(e => console.error(e));

    return () => {
      setAccountsSubscriptionConfirmed(false);
      setTokensSubscriptionConfirmed(false);
      connection.off(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
      connection.off(TzktSubscriptionChannel.Accounts, accountsListener);
    };
  }, [accountsListener, tokenBalancesListener, connection, connectionReady, publicKeyHash]);

  return {
    subscribedToGasUpdates: accountsSubscriptionConfirmed,
    subscribedToTokensUpdates: tokensSubscriptionConfirmed
  };
};
