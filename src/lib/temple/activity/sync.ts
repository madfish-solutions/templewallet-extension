import BigNumber from 'bignumber.js';

import { getTokenTransfers, BCD_NETWORKS_NAMES, BcdTokenTransfer } from 'lib/better-call-dev';
import * as Repo from 'lib/temple/repo';
import { TZKT_API_BASE_URLS, getOperations, TzktOperation } from 'lib/tzkt';

import { deletePendingOp } from './deletePendingOp';
import { isPositiveNumber, tryParseTokenTransfers, toTokenId, getBcdTokenTransferId } from './helpers';

export function isSyncSupported(chainId: string) {
  return TZKT_API_BASE_URLS.has(chainId as any) && BCD_NETWORKS_NAMES.has(chainId as any);
}

export async function syncOperations(type: 'new' | 'old', chainId: string, address: string) {
  if (!isSyncSupported(chainId)) {
    throw new Error('Not supported for this chainId');
  }

  const [tzktTime, bcdTime] = await Promise.all(
    ['tzkt', 'bcd'].map(service => Repo.syncTimes.get({ service, chainId, address }))
  );

  const fresh = type === 'new';
  const bcdNetwork = BCD_NETWORKS_NAMES.get(chainId as any)!;

  const [tzktOperations, bcdTokenTransfers] = await Promise.all([
    getOperations(chainId as any, {
      address,
      sort: 1,
      limit: 1000,
      [getFreshTzktField(fresh)]:
        tzktTime && new Date(fresh ? tzktTime.higherTimestamp + 1 : tzktTime.lowerTimestamp).toISOString()
    }),
    getTokenTransfers({
      network: bcdNetwork,
      address,
      sort: 'desc',
      [getFreshBcdField(fresh)]:
        bcdTime &&
        new BigNumber(fresh ? bcdTime.higherTimestamp + 1_000 : bcdTime.lowerTimestamp).idiv(1_000).toNumber()
    })
  ]);

  let tokenTransfers = bcdTokenTransfers.transfers;

  const totalBcdTransfers = bcdTokenTransfers.total;
  if (totalBcdTransfers > bcdTokenTransfers.transfers.length) {
    let lastId = bcdTokenTransfers.last_id;

    while (true) {
      const result = await getTokenTransfers({
        network: bcdNetwork,
        address,
        sort: 'desc',
        last_id: lastId
      });

      if (result.transfers.length === 0) break;

      tokenTransfers = [...tokenTransfers, ...result.transfers];
      if (tokenTransfers.length > 200) break;

      lastId = result.last_id;
    }
  }

  /**
   * TZKT
   */

  syncTzktOperations(tzktOperations, chainId, address, tzktTime, fresh);

  /**
   * BCD
   */

  syncBcdOperations(tokenTransfers, chainId, address, tzktTime, fresh);

  // delete outdated pending operations
  deletePendingOp();

  return tzktOperations.length + tokenTransfers.length;
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

const syncBcdOperations = async (
  tokenTransfers: BcdTokenTransfer[],
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
    memberSet.add(tokenTrans.from);
    memberSet.add(tokenTrans.to);

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
          bcdTokenTransfers: [tokenTrans]
        }
      });
    } else {
      await Repo.operations.where({ hash: tokenTrans.hash }).modify(op => {
        op.members = members;
        op.assetIds = assetIds;

        if (!op.data.bcdTokenTransfers) {
          op.data.bcdTokenTransfers = [tokenTrans];
        } else if (
          op.data.bcdTokenTransfers.every(trans => getBcdTokenTransferId(trans) !== getBcdTokenTransferId(tokenTrans))
        ) {
          op.data.bcdTokenTransfers.push(tokenTrans);
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

const getFreshBcdField = (fresh: boolean) => (fresh ? 'start' : 'end');
