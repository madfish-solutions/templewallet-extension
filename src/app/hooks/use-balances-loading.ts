import { useCallback, useEffect, useState } from 'react';

import { noop } from 'lodash';

import { dispatch } from 'app/store';
import { loadGasBalanceActions, loadAssetsBalancesActions, putTokensBalancesAction } from 'app/store/balances/actions';
import { useBalancesLoadingSelector } from 'app/store/balances/selectors';
import { fixBalances } from 'app/store/balances/utils';
import {
  TzktSubscriptionChannel,
  TzktSubscriptionMethod,
  TzktSubscriptionStateMessageType,
  TzktAccountsSubscriptionMessage,
  TzktTokenBalancesSubscriptionMessage,
  TzktAccountType,
  isKnownChainId
} from 'lib/apis/tzkt';
import { toTokenSlug } from 'lib/assets';
import { useAccount, useOnBlock, useTzktConnection } from 'lib/temple/front';
import { useUpdatableRef } from 'lib/ui/hooks';
import { useTezosNetwork } from 'temple/hooks';

export const useBalancesLoading = () => {
  const { chainId } = useTezosNetwork();
  const { publicKeyHash } = useAccount();

  const isLoading = useBalancesLoadingSelector(publicKeyHash, chainId);
  const isLoadingRef = useUpdatableRef(isLoading);

  const { connection, connectionReady } = useTzktConnection();
  const [tokensSubscriptionConfirmed, setTokensSubscriptionConfirmed] = useState(false);
  const [accountsSubscriptionConfirmed, setAccountsSubscriptionConfirmed] = useState(false);

  const tokenBalancesListener = useCallback(
    (msg: TzktTokenBalancesSubscriptionMessage) => {
      const skipDispatch = isLoadingRef.current || !isKnownChainId(chainId);

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
    [publicKeyHash, chainId, isLoadingRef]
  );

  const accountsListener = useCallback(
    (msg: TzktAccountsSubscriptionMessage) => {
      const skipDispatch = isLoadingRef.current || !isKnownChainId(chainId);

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
    [publicKeyHash, chainId, isLoadingRef]
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
  }, [accountsListener, tokenBalancesListener, connection, connectionReady, publicKeyHash]);

  const dispatchLoadGasBalanceAction = useCallback(() => {
    if (isLoadingRef.current === false && isKnownChainId(chainId)) {
      dispatch(loadGasBalanceActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, isLoadingRef]);

  useEffect(dispatchLoadGasBalanceAction, [dispatchLoadGasBalanceAction]);
  useOnBlock(dispatchLoadGasBalanceAction, undefined, accountsSubscriptionConfirmed);

  const dispatchLoadAssetsBalancesActions = useCallback(() => {
    if (isLoadingRef.current === false && isKnownChainId(chainId)) {
      dispatch(loadAssetsBalancesActions.submit({ publicKeyHash, chainId }));
    }
  }, [publicKeyHash, chainId, isLoadingRef]);

  useEffect(dispatchLoadAssetsBalancesActions, [dispatchLoadAssetsBalancesActions]);
  useOnBlock(dispatchLoadAssetsBalancesActions, undefined, tokensSubscriptionConfirmed);
};
