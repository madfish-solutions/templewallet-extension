import * as Repo from 'lib/temple/repo';
import {
  TZKT_API_BASE_URLS,
  getOperations,
  getTokenTransfers,
  getTokenTransfersCount,
  getFa12Transfers,
  getFa2Transfers
} from 'lib/tzkt';
import { TzktOperation, TzktTokenTransfer } from 'lib/tzkt/types';

import { isKnownChainId } from '../types';
import { deletePendingOp } from './deletePendingOp';
import { isPositiveNumber, tryParseTokenTransfers, toTokenId } from './helpers';

export const isSyncSupported = (chainId: string) => TZKT_API_BASE_URLS.has(chainId as any);

async function fetchTzktTokenTransfers(chainId: string, address: string) {
  if (!isKnownChainId(chainId) || !TZKT_API_BASE_URLS.has(chainId)) {
    return [];
  }

  const size = 100;

  const total = await getTokenTransfersCount(chainId, { address });

  let tokenTransfers = await getTokenTransfers(chainId, {
    address,
    offset: 0,
    limit: size,
    type: ['delegation', 'origination', 'transaction']
  });

  if (total > size) {
    const requests = Math.floor(total / size);
    const restResponses = await Promise.all(
      Array.from({ length: requests }).map((_, i) =>
        getTokenTransfers(chainId, {
          address,
          limit: size,
          offset: (i + 1) * size,
          type: ['delegation', 'origination', 'transaction']
        })
      )
    );

    tokenTransfers = [...tokenTransfers, ...restResponses.flat()];
  }

  return tokenTransfers;
}

async function fetchTzktOperations(chainId: string, address: string, fresh: boolean, tzktTime?: Repo.ISyncTime) {
  if (!isKnownChainId(chainId) || !TZKT_API_BASE_URLS.has(chainId)) {
    return [];
  }

  const size = 1000;

  const operations = await getOperations(chainId, {
    address,
    sort: 1,
    limit: size,
    offset: 0,
    to: tzktTime && new Date(fresh ? Date.now() : tzktTime.lowerTimestamp).toISOString()
  });

  return operations;
}

async function fetchFa12Transfers(chainId: string, address: string, fresh: boolean, tzktTime?: Repo.ISyncTime) {
  if (!isKnownChainId(chainId) || !TZKT_API_BASE_URLS.has(chainId)) {
    return [];
  }

  const size = 1000;

  const operations = await getFa12Transfers(chainId, {
    address,
    limit: size,
    offset: 0,
    to: tzktTime && new Date(fresh ? Date.now() : tzktTime.lowerTimestamp).toISOString()
  });

  return operations;
}

async function fetchFa2Transfers(chainId: string, address: string, fresh: boolean, tzktTime?: Repo.ISyncTime) {
  if (!isKnownChainId(chainId) || !TZKT_API_BASE_URLS.has(chainId)) {
    return [];
  }

  const size = 1000;

  const operations = await getFa2Transfers(chainId, {
    address,
    limit: size,
    offset: 0,
    to: tzktTime && new Date(fresh ? Date.now() : tzktTime.lowerTimestamp).toISOString()
  });

  return operations;
}

export async function syncOperations(type: 'new' | 'old', chainId: string, address: string) {
  if (!isSyncSupported(chainId)) {
    throw new Error('Not supported for this chainId');
  }

  const [tzktTime] = await Promise.all(['tzkt'].map(service => Repo.syncTimes.get({ service, chainId, address })));

  const fresh = type === 'new';

  const [tzktAccountOperations, tzktFa12Transfers, tzktFa2Transfers, tzktTokenTransfers] = await Promise.all([
    fetchTzktOperations(chainId, address, fresh, tzktTime),
    fetchFa12Transfers(chainId, address, fresh, tzktTime),
    fetchFa2Transfers(chainId, address, fresh, tzktTime),
    fetchTzktTokenTransfers(chainId, address)
  ]);

  const tzktOperations = [...tzktAccountOperations, ...tzktFa12Transfers, ...tzktFa2Transfers].sort(
    (a, b) => a.level ?? 0 - (b.level ?? 0)
  );

  /**
   * TZKT operations
   */

  await syncTzktOperations(tzktOperations, chainId, address, tzktTime, fresh);

  /**
   * ex BCD, TZKT token transfers
   */

  await syncTzktTokenTransfers(tzktTokenTransfers, tzktOperations, chainId, address, tzktTime, fresh);

  // delete outdated pending operations
  await deletePendingOp();

  return tzktTokenTransfers.length + tzktFa12Transfers.length + tzktFa12Transfers.length;
}

const afterSyncUpdate = async (
  serviceName: string,
  chainId: string,
  address: string,
  fresh: boolean,
  higherTimestamp: number,
  lowerTimestamp: number
) =>
  await Repo.syncTimes.where({ service: serviceName, chainId, address }).modify(st => {
    if (fresh) {
      st.higherTimestamp = higherTimestamp;
    } else {
      st.lowerTimestamp = lowerTimestamp;
    }
  });

const syncTzktOperations = async (
  tzktOperations: TzktOperation[],
  chainId: string,
  address: string,
  tzktTime: Repo.ISyncTime | undefined,
  fresh: boolean
) => {
  for (const tzktOp of tzktOperations) {
    const current = await Repo.operations.get(tzktOp.hash);

    const memberSet = new Set(current?.members);
    const assetIdSet = new Set(current?.assetIds);

    addPositiveToOpeartionSet(tzktOp, assetIdSet);
    addMemberSetOperations(tzktOp, assetIdSet, memberSet);

    const members = Array.from(memberSet);
    const assetIds = Array.from(assetIdSet);

    if (!current) {
      await Repo.operations.add({
        hash: tzktOp.hash,
        chainId,
        members,
        assetIds,
        addedAt: +new Date(tzktOp.timestamp),
        data: {
          tzktGroup: [tzktOp]
        }
      });
    } else {
      await Repo.operations.where({ hash: tzktOp.hash }).modify(op => {
        op.members = members;
        op.assetIds = assetIds;

        if (!op.data.tzktGroup) {
          op.data.tzktGroup = [tzktOp];
        } else if (op.data.tzktGroup.every(tOp => tOp.id !== tzktOp.id)) {
          op.data.tzktGroup.push(tzktOp);
        }
      });
    }
  }

  if (tzktOperations.length > 0) {
    const higherTimestamp = +new Date(tzktOperations[0]?.timestamp);
    const lowerTimestamp = +new Date(tzktOperations[tzktOperations.length - 1]?.timestamp);

    if (!tzktTime) {
      await Repo.syncTimes.add({
        service: 'tzkt',
        chainId,
        address,
        higherTimestamp,
        lowerTimestamp
      });
    } else {
      await afterSyncUpdate('tzkt', chainId, address, fresh, higherTimestamp, lowerTimestamp);
    }
  }
};

const addPositiveToOpeartionSet = (tzktOp: TzktOperation, assetIdSet: Set<string>) =>
  void (
    (tzktOp.type === 'transaction' || tzktOp.type === 'delegation') &&
    tzktOp.amount &&
    isPositiveNumber(tzktOp.amount) &&
    assetIdSet.add('tez')
  );

const addMemberSetOperations = (tzktOp: TzktOperation, assetIdSet: Set<string>, memberSet: Set<string>) => {
  if (tzktOp.type === 'transaction') {
    memberSet.add(tzktOp.sender.address);
    memberSet.add(tzktOp.target.address);

    if (tzktOp.parameters) {
      try {
        tryParseTokenTransfers(JSON.parse(tzktOp.parameters), tzktOp.target.address, (assetId, from, to) => {
          memberSet.add(from).add(to);
          assetIdSet.add(assetId);
        });
      } catch {}
    }
  } else if (tzktOp.type === 'delegation') {
    memberSet.add(tzktOp.sender.address);
  }
};

const syncTzktTokenTransfers = async (
  tokenTransfers: Array<TzktTokenTransfer>,
  operations: Array<TzktOperation>,
  chainId: string,
  address: string,
  tzktTime: Repo.ISyncTime | undefined,
  fresh: boolean
) => {
  for (const tokenTrans of tokenTransfers) {
    const operation = operations.find(x => x.id === tokenTrans.transactionId);
    if (!operation) continue;
    const current = await Repo.operations.get(operation.hash);

    const memberSet = new Set(current?.members);
    const assetIdSet = new Set(current?.assetIds);

    memberSet.add(
      operation.type !== 'reveal' && operation.type !== 'origination' && operation.initiator
        ? operation.initiator.address
        : address
    );
    memberSet.add(tokenTrans.from ? tokenTrans.from.address : address);
    memberSet.add(tokenTrans.to ? tokenTrans.to.address : address);

    assetIdSet.add(toTokenId(tokenTrans.token.contract.address, tokenTrans.token.tokenId));

    const members = Array.from(memberSet);
    const assetIds = Array.from(assetIdSet);

    if (!current) {
      await Repo.operations.add({
        hash: operation.hash,
        chainId,
        members,
        assetIds,
        addedAt: +new Date(tokenTrans.timestamp),
        data: {
          tzktTokenTransfers: [tokenTrans]
        }
      });
    } else {
      await Repo.operations.where({ hash: operation.hash }).modify(op => {
        op.members = members;
        op.assetIds = assetIds;

        if (!op.data.tzktTokenTransfers) {
          op.data.tzktTokenTransfers = [tokenTrans];
        } else if (op.data.tzktTokenTransfers.every(trans => trans.transactionId !== tokenTrans.transactionId)) {
          op.data.tzktTokenTransfers.push(tokenTrans);
        }
      });
    }
  }

  if (tokenTransfers.length > 0) {
    const higherTimestamp = +new Date(tokenTransfers[0]?.timestamp);
    const lowerTimestamp = +new Date(tokenTransfers[tokenTransfers.length - 1]?.timestamp);

    if (!tzktTime) {
      await Repo.syncTimes.add({
        service: 'tzkt',
        chainId,
        address,
        higherTimestamp,
        lowerTimestamp
      });
    } else {
      await afterSyncUpdate('tzkt', chainId, address, fresh, higherTimestamp, lowerTimestamp);
    }
  }
};
