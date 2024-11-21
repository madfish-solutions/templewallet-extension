import { Draft } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';
import { Mutex } from 'async-mutex';
import { BigNumber } from 'bignumber.js';
import { getAddress } from 'viem';

import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isNativeTokenAddress } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { EVM_RPC_REQUESTS_INTERVAL } from 'lib/fixed-times';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';
import { QueueOfUnique } from 'lib/utils/queue-of-unique';

import { LoadOnChainBalancePayload } from './actions';
import { AssetSlugBalanceRecord, EvmBalancesAtomicRecord } from './state';

export const assignBalances = (
  balancesAtomic: Draft<EvmBalancesAtomicRecord>,
  publicKeyHash: HexString,
  chainId: number,
  data: AssetSlugBalanceRecord
) => {
  if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};
  const accountBalances = balancesAtomic[publicKeyHash];

  accountBalances[chainId] = Object.assign({}, accountBalances[chainId] ?? {}, data);
};

export const getTokenSlugBalanceRecord = (data: BalanceItem[], chainId: number) =>
  data.reduce<AssetSlugBalanceRecord>((acc, currentValue) => {
    const contractAddress = getAddress(currentValue.contract_address);

    if (currentValue.nft_data) {
      for (const nftItem of currentValue.nft_data) {
        if (!isPositiveCollectibleBalance(nftItem)) continue;

        acc[toTokenSlug(contractAddress, nftItem.token_id)] = nftItem.token_balance;
      }

      return acc;
    }

    if (!isPositiveTokenBalance(currentValue)) return acc;

    if (isNativeTokenAddress(chainId, currentValue.contract_address)) {
      acc[EVM_TOKEN_SLUG] = currentValue.balance;
    } else {
      acc[toTokenSlug(contractAddress)] = currentValue.balance;
    }

    return acc;
  }, {});

interface RequestQueueElement extends LoadOnChainBalancePayload {
  onSuccess: SyncFn<BigNumber>;
  onError: SyncFn<Error>;
}
const requestsAreSame = (a: RequestQueueElement, b: RequestQueueElement) =>
  a.network.chainId === b.network.chainId && a.assetSlug === b.assetSlug && a.account === b.account;

export class RequestAlreadyPendingError extends Error {}

class EvmOnChainBalancesRequestsExecutor {
  private requestsQueues = new Map<number, QueueOfUnique<RequestQueueElement>>();
  private mapMutex = new Mutex();
  private requestInterval: NodeJS.Timer;

  constructor() {
    this.executeNextRequests = this.executeNextRequests.bind(this);
    this.requestInterval = setInterval(() => this.executeNextRequests(), EVM_RPC_REQUESTS_INTERVAL);
  }

  async executeRequest(payload: LoadOnChainBalancePayload) {
    const { chainId } = payload.network;

    return new Promise<BigNumber>(async (resolve, reject) => {
      const queue = await this.mapMutex.runExclusive(async () => {
        let result = this.requestsQueues.get(chainId);
        if (!result) {
          result = new QueueOfUnique<RequestQueueElement>(requestsAreSame);
          this.requestsQueues.set(chainId, result);
        }

        return result;
      });

      queue.push({
        ...payload,
        onSuccess: resolve,
        onError: reject
      });
    });
  }

  finalize() {
    clearInterval(this.requestInterval);
  }

  private async executeNextRequests() {
    const requests = await this.mapMutex.runExclusive(() => {
      const requestsPromises: Promise<RequestQueueElement | undefined>[] = [];
      this.requestsQueues.forEach(queue => requestsPromises.push(queue.pop()));

      return Promise.all(requestsPromises).then(requests => requests.filter(isDefined));
    });

    return Promise.all(
      requests.map(async ({ network, assetSlug, account, assetStandard, onSuccess, onError }) => {
        try {
          const balance = await fetchEvmRawBalance(network, assetSlug, account, assetStandard);
          onSuccess(balance);
        } catch (err: any) {
          onError(err);
        }
      })
    );
  }
}

export const evmOnChainBalancesRequestsExecutor = new EvmOnChainBalancesRequestsExecutor();
