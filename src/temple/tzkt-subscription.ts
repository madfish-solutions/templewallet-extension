import { HubConnectionBuilder } from '@microsoft/signalr';

import { dispatch } from 'app/store';
import { loadAssetsBalancesActions, loadGasBalanceActions, putTokensBalancesAction } from 'app/store/balances/actions';
import { fixBalances } from 'app/store/balances/utils';
import { toTokenSlug } from 'lib/assets';

import type { TzktApiChainId } from '../lib/apis/tzkt/api';
import { TZKT_API_BASE_URLS } from '../lib/apis/tzkt/misc';
import {
  TzktAccountType,
  TzktAccountsSubscriptionMessage,
  TzktHubConnection,
  TzktSubscriptionChannel,
  TzktSubscriptionMethod,
  TzktSubscriptionStateMessageType,
  TzktTokenBalancesSubscriptionMessage
} from '../lib/apis/tzkt/types';
import { calcTzktAccountSpendableTezBalance } from '../lib/apis/tzkt/utils';

export class TempleTzktSubscription {
  private _ready = false;
  private accountsSubConfirmed = false;
  private tokensSubConfirmed = false;
  private connection: TzktHubConnection;

  constructor(
    readonly chainId: TzktApiChainId,
    readonly accountAddress: string,
    private shouldSkipDispatch: SyncFn<void, boolean>,
    private onStatusChanged: EmptyFn
  ) {
    const nativeConnection = new HubConnectionBuilder().withUrl(`${TZKT_API_BASE_URLS[chainId]}/ws`).build();
    this.connection = nativeConnection;

    this.init();
  }

  get state() {
    return this.connection.state;
  }

  get ready() {
    return this._ready;
  }

  get isReady() {
    return Boolean(this.connection.connectionId);
  }

  get subscribedToGasUpdates() {
    return this.ready && this.accountsSubConfirmed;
  }

  get subscribedToTokensUpdates() {
    return this.ready && this.tokensSubConfirmed;
  }

  async cancel() {
    const nativeConnection = this.connection;

    await nativeConnection.stop().catch(err => void console.error(err));

    nativeConnection.off(TzktSubscriptionChannel.TokenBalances, this.tokenBalancesListener);
    nativeConnection.off(TzktSubscriptionChannel.Accounts, this.accountsListener);
  }

  private async init() {
    const connection = this.connection;

    try {
      await this.connection.start();
      this._ready = true;
      this.onStatusChanged();

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
