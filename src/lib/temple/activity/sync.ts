// import { getTokenTransfers, BCD_NETWORKS_NAMES, BcdTokenTransfer } from 'lib/better-call-dev';
import * as Repo from 'lib/temple/repo';
import {
  TZKT_API_BASE_URLS,
  getOperations,
  TzktOperation,
  getTokenTransfers,
  getTokenTransfersCount,
  getOperationsCount,
  TzktTokenTransfer
} from 'lib/tzkt';

import { isKnownChainId } from '../types';
import { deletePendingOp } from './deletePendingOp';
import { isPositiveNumber, tryParseTokenTransfers, toTokenId, getBcdTokenTransferId } from './helpers';

export const isSyncSupported = (chainId: string) => TZKT_API_BASE_URLS.has(chainId as any);

async function fetchTzktTokenTransfers(chainId: string, address: string) {
  if (!isKnownChainId(chainId) || !TZKT_API_BASE_URLS.has(chainId)) {
    return [];
  }

  const size = 100;

  const total = await getTokenTransfersCount(chainId as any, { address });

  let tokenTransfers = await getTokenTransfers(chainId as any, {
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

async function fetchTzktOperations(
  chainId: string,
  address: string,
  fresh: boolean,
  tzktTime: Repo.ISyncTime | undefined
) {
  if (!isKnownChainId(chainId) || !TZKT_API_BASE_URLS.has(chainId)) {
    return [];
  }

  const size = 1000;

  const total = await getOperationsCount(chainId as any, { address });

  let balances = await getOperations(chainId as any, {
    address,
    sort: 1,
    limit: size,
    offset: 0,
    [getFreshTzktField(fresh)]:
      tzktTime && new Date(fresh ? tzktTime.higherTimestamp + 1 : tzktTime.lowerTimestamp).toISOString()
  });

  if (total > size) {
    const requests = Math.floor(total / size);
    const restResponses = await Promise.all(
      Array.from({ length: requests }).map((_, i) =>
        getOperations(chainId as any, {
          address,
          sort: 1,
          limit: size,
          offset: (i + 1) * size,
          [getFreshTzktField(fresh)]:
            tzktTime && new Date(fresh ? tzktTime.higherTimestamp + 1 : tzktTime.lowerTimestamp).toISOString()
        })
      )
    );

    balances = [...balances, ...restResponses.flat()];
  }

  return balances;
}

export async function syncOperations(type: 'new' | 'old', chainId: string, address: string) {
  if (!isSyncSupported(chainId)) {
    throw new Error('Not supported for this chainId');
  }

  const [tzktTime] = await Promise.all(['tzkt'].map(service => Repo.syncTimes.get({ service, chainId, address })));

  const fresh = type === 'new';

  const [tzktOperations, tzktTokenTransfers] = await Promise.all([
    fetchTzktOperations(chainId, address, fresh, tzktTime),
    fetchTzktTokenTransfers(chainId, address)
  ]);

  /**
   * TZKT operations
   */

  syncTzktOperations(tzktOperations, chainId, address, tzktTime, fresh);

  /**
   * ex BCD, TZKT token transfers
   */

  syncTzktTokenTransfers(tzktTokenTransfers, chainId, address, tzktTime, fresh);

  // delete outdated pending operations
  await deletePendingOp();

  return tzktOperations.length;
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
    if (tzktOp.initiator) {
      memberSet.add(tzktOp.initiator.address);
    }
    if (tzktOp.newDelegate) {
      memberSet.add(tzktOp.newDelegate.address);
    }
  }
};

const syncTzktTokenTransfers = async (
  tokenTransfers: Array<TzktTokenTransfer>,
  chainId: string,
  address: string,
  tzktTime: Repo.ISyncTime | undefined,
  fresh: boolean
) => {
  for (const tokenTrans of tokenTransfers) {
    const current = await Repo.operations.get(tokenTrans.hash);

    const memberSet = new Set(current?.members);
    const assetIdSet = new Set(current?.assetIds);

    memberSet.add(tokenTrans.initiator);
    memberSet.add(tokenTrans.sender.address);
    memberSet.add(tokenTrans.target.address);

    assetIdSet.add(toTokenId(tokenTrans.contract, tokenTrans.token_id));

    const members = Array.from(memberSet);
    const assetIds = Array.from(assetIdSet);

    if (!current) {
      await Repo.operations.add({
        hash: tokenTrans.hash,
        chainId,
        members,
        assetIds,
        addedAt: +new Date(tokenTrans.timestamp),
        data: {
          tzktTokenTransfers: [tokenTrans]
        }
      });
    } else {
      await Repo.operations.where({ hash: tokenTrans.hash }).modify(op => {
        op.members = members;
        op.assetIds = assetIds;

        if (!op.data.tzktTokenTransfers) {
          op.data.tzktTokenTransfers = [tokenTrans];
        } else if (
          op.data.tzktTokenTransfers.every(trans => getBcdTokenTransferId(trans) !== getBcdTokenTransferId(tokenTrans))
        ) {
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
        service: 'bcd',
        chainId,
        address,
        higherTimestamp,
        lowerTimestamp
      });
    } else {
      await afterSyncUpdate('bcd', chainId, address, fresh, higherTimestamp, lowerTimestamp);
    }
  }
};

const getFreshTzktField = (fresh: boolean) => (fresh ? 'from' : 'to');
