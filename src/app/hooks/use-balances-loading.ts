import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [tokensSubscriptionConfirmed, setTokensSubscriptionConfirmed] = useState(false);
  const [accountsSubscriptionConfirmed, setAccountsSubscriptionConfirmed] = useState(false);
  const triedToLoadTokensBalancesAddressRef = useRef<string>();
  const triedToLoadTezBalanceAddressRef = useRef<string>();

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
          break;
        default:
          setTokensSubscriptionConfirmed(true);
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
          break;
        default:
          setAccountsSubscriptionConfirmed(true);
      }
    },
    [chainId, dispatch, publicKeyHash]
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
        setAccountsSubscriptionConfirmed(false);
        setTokensSubscriptionConfirmed(false);
        connection.off(TzktSubscriptionChannel.TokenBalances, tokenBalancesListener);
        connection.off(TzktSubscriptionChannel.Accounts, accountsListener);
      };
    }

    return noop;
  }, [accountsListener, connection, connectionReady, publicKeyHash, tokenBalancesListener]);

  useInterval(
    () => {
      if (!accountsSubscriptionConfirmed || publicKeyHash !== triedToLoadTezBalanceAddressRef.current) {
        dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
        triedToLoadTezBalanceAddressRef.current = publicKeyHash;
      }
    },
    BALANCES_SYNC_INTERVAL,
    [chainId, publicKeyHash, accountsSubscriptionConfirmed],
    true
  );

  useInterval(
    () => {
      if (!tokensSubscriptionConfirmed || publicKeyHash !== triedToLoadTokensBalancesAddressRef.current) {
        dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
        triedToLoadTokensBalancesAddressRef.current = publicKeyHash;
      }
    },
    BALANCES_SYNC_INTERVAL,
    [chainId, publicKeyHash, tokensSubscriptionConfirmed],
    false // Not calling immediately, because balances are also loaded via assets loading
  );
};
