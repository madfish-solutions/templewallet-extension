import { useCallback, useEffect, useState } from 'react';

import { noop } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadGasBalanceActions, loadAssetsBalancesActions, putTokensBalancesAction } from 'app/store/balances/actions';
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
import { BALANCES_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useTzktConnection } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';

export const useBalancesLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const { connection, connectionReady } = useTzktConnection();
  const [subscriptionsInvoked, setSubscriptionsInvoked] = useState(false);

  const dispatch = useDispatch();

  const tokenBalancesListener = useCallback(
    (msg: TzktTokenBalancesSubscriptionMessage) => {
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
      }
    },
    [chainId, dispatch, publicKeyHash]
  );
  const accountsListener = useCallback(
    (msg: TzktAccountsSubscriptionMessage) => {
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
      }
    },
    [chainId, dispatch, publicKeyHash]
  );

  useEffect(() => {
    if (connection && connectionReady) {
      Promise.all([
        connection.invoke(TzktSubscriptionMethod.SubscribeToAccounts, { addresses: [publicKeyHash] }),
        connection.invoke(TzktSubscriptionMethod.SubscribeToTokenBalances, { account: publicKeyHash })
      ])
        .then(() => {
          connection.on(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
          connection.on(TzktSubscriptionChannel.Accounts, accountsListener);
          setSubscriptionsInvoked(true);
        })
        .catch(e => {
          console.error(e);
          connection.off(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
          connection.off(TzktSubscriptionChannel.Accounts, accountsListener);
        });

      return () => setSubscriptionsInvoked(false);
    }

    return noop;
  }, [accountsListener, connection, connectionReady, publicKeyHash, tokenBalancesListener]);

  useInterval(
    () => !subscriptionsInvoked && dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId })),
    BALANCES_SYNC_INTERVAL,
    [chainId, publicKeyHash, subscriptionsInvoked],
    true
  );

  useInterval(
    () => !subscriptionsInvoked && dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId })),
    BALANCES_SYNC_INTERVAL,
    [chainId, publicKeyHash, subscriptionsInvoked],
    false // Not calling immediately, because balances are also loaded via assets loading
  );
};
