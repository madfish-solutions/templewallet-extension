import { HubConnectionBuilder } from '@microsoft/signalr';

import { dispatch } from 'app/store';
import { loadAssetsBalancesActions, loadGasBalanceActions, putTokensBalancesAction } from 'app/store/balances/actions';
import { fixBalances } from 'app/store/balances/utils';
import type { TzktApiChainId } from 'lib/apis/tzkt/api';
import { TZKT_API_BASE_URLS } from 'lib/apis/tzkt/misc';
import {
  TzktAccountType,
  TzktAccountsSubscriptionMessage,
  TzktHubConnection,
  TzktSubscriptionChannel,
  TzktSubscriptionMethod,
  TzktSubscriptionStateMessageType,
  TzktTokenBalancesSubscriptionMessage
} from 'lib/apis/tzkt/types';
import { calcTzktAccountSpendableTezBalance } from 'lib/apis/tzkt/utils';
import { toTokenSlug } from 'lib/assets';

export class TempleTzktSubscription {
  private accountsSubConfirmed = false;
  private tokensSubConfirmed = false;
  private connection: TzktHubConnection | nullish;

  constructor(
    readonly chainId: TzktApiChainId,
    readonly accountAddress: string,
    private shouldSkipDispatch: SyncFn<void, boolean>,
    private onStatusChanged: EmptyFn
  ) {
    this.spawnConnection();
  }

  get subscribedToGasUpdates() {
    return this.accountsSubConfirmed;
  }

  get subscribedToTokensUpdates() {
    return this.tokensSubConfirmed;
  }

  /** (!) Not notifying on state change after this - beware of memory leaks */
  async destroy() {
    const connection = this.connection;
    if (!connection) return;
    delete this.connection;

    await connection.stop().catch(err => void console.error(err));

    connection.off(TzktSubscriptionChannel.TokenBalances, this.tokenBalancesListener);
    connection.off(TzktSubscriptionChannel.Accounts, this.accountsListener);
  }

  private async spawnConnection() {
    const connection = new HubConnectionBuilder().withUrl(`${TZKT_API_BASE_URLS[this.chainId]}/ws`).build();
    this.connection = connection;

    try {
      await connection.start();

      connection.onclose(async error => {
        console.error(error);

        if (!this.connection) return; // Already destroyed

        this.accountsSubConfirmed = false;
        this.tokensSubConfirmed = false;

        this.onStatusChanged();

        await this.destroy();

        setTimeout(() => void this.spawnConnection(), 1000);
      });

      connection.on(TzktSubscriptionChannel.TokenBalances, this.tokenBalancesListener);
      connection.on(TzktSubscriptionChannel.Accounts, this.accountsListener);

      Promise.all([
        connection.invoke(TzktSubscriptionMethod.SubscribeToAccounts, { addresses: [this.accountAddress] }),
        connection.invoke(TzktSubscriptionMethod.SubscribeToTokenBalances, { account: this.accountAddress })
      ]).catch(e => console.error(e));
    } catch (error) {
      console.error(error);
    }
  }

  private tokenBalancesListener = (msg: TzktTokenBalancesSubscriptionMessage) => {
    const skipDispatch = this.shouldSkipDispatch();
    const { chainId, accountAddress: publicKeyHash } = this;

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
        this.tokensSubConfirmed = true;
        this.onStatusChanged();
    }
  };

  private accountsListener = (msg: TzktAccountsSubscriptionMessage) => {
    const skipDispatch = this.shouldSkipDispatch();
    const { chainId, accountAddress: publicKeyHash } = this;

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
        this.accountsSubConfirmed = true;
        this.onStatusChanged();
    }
  };
}
