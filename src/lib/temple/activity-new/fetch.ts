import type { TzktApiChainId, TzktOperation } from 'lib/apis/tzkt';
import * as TZKT from 'lib/apis/tzkt';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { detectTokenStandard } from 'lib/assets/standards';
import { ReactiveTezosToolkit } from 'lib/temple/front';
import { TempleAccount } from 'lib/temple/types';
import { filterUnique } from 'lib/utils';

import type { Activity, OperationsGroup } from './types';
import { operationsGroupToActivity } from './utils';

const LIQUIDITY_BAKING_DEX_ADDRESS = 'KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5';

export default async function fetchActivities(
  chainId: TzktApiChainId,
  account: TempleAccount,
  assetSlug: string | undefined,
  pseudoLimit: number,
  tezos: ReactiveTezosToolkit,
  olderThan?: Activity
): Promise<Activity[]> {
  const operations = await fetchOperations(chainId, account, assetSlug, pseudoLimit, tezos, olderThan);

  const groups = await fetchOperGroupsForOperations(chainId, operations, olderThan);

  return groups.map(group => operationsGroupToActivity(group, account.publicKeyHash));
}

/**
 * Returned items are sorted new-to-old.
 *
 * @arg pseudoLimit // Is pseudo, because, number of returned activities is not guarantied to equal to it.
 * 	It can also be smaller, even when older items are available (they can be fetched later).
 */
async function fetchOperations(
  chainId: TzktApiChainId,
  account: TempleAccount,
  assetSlug: string | undefined,
  pseudoLimit: number,
  tezos: ReactiveTezosToolkit,
  olderThan?: Activity
): Promise<TzktOperation[]> {
  const { publicKeyHash: accAddress } = account;

  if (assetSlug) {
    const [contractAddress, tokenId] = (assetSlug ?? '').split('_');

    if (assetSlug === TEZ_TOKEN_SLUG) {
      return await fetchOperations_TEZ(chainId, accAddress, pseudoLimit, olderThan);
    } else if (assetSlug === LIQUIDITY_BAKING_DEX_ADDRESS) {
      return await fetchOperations_Contract(chainId, accAddress, pseudoLimit, olderThan);
    } else {
      const tokenType = await detectTokenStandard(tezos, contractAddress);

      if (tokenType === 'fa1.2') {
        return await fetchOperations_Token_Fa_1_2(chainId, accAddress, contractAddress, pseudoLimit, olderThan);
      } else if (tokenType === 'fa2') {
        return await fetchOperations_Token_Fa_2(chainId, accAddress, contractAddress, tokenId, pseudoLimit, olderThan);
      }
    }
  }

  return await fetchOperations_Any(chainId, accAddress, pseudoLimit, olderThan);
}

const fetchOperations_TEZ = (
  chainId: TzktApiChainId,
  accountAddress: string,
  pseudoLimit: number,
  olderThan?: Activity
) =>
  TZKT.fetchGetOperationsTransactions(chainId, {
    'anyof.sender.target.initiator': accountAddress,
    ...buildOlderThanParam(olderThan),
    limit: pseudoLimit,
    'sort.desc': 'id',
    'amount.ne': '0'
  });

const fetchOperations_Contract = (
  chainId: TzktApiChainId,
  accountAddress: string,
  pseudoLimit: number,
  olderThan?: Activity
) =>
  TZKT.fetchGetAccountOperations(chainId, accountAddress, {
    type: 'transaction',
    limit: pseudoLimit,
    sort: 1,
    initiator: accountAddress,
    entrypoint: 'mintOrBurn',
    'level.lt': olderThan?.oldestTzktOperation.level
  });

const fetchOperations_Token_Fa_1_2 = (
  chainId: TzktApiChainId,
  accountAddress: string,
  contractAddress: string,
  pseudoLimit: number,
  olderThan?: Activity
) =>
  TZKT.fetchGetOperationsTransactions(chainId, {
    limit: pseudoLimit,
    entrypoint: 'transfer',
    'sort.desc': 'level',
    target: contractAddress,
    'parameter.in': `[{"from":"${accountAddress}"},{"to":"${accountAddress}"}]`,
    'level.lt': olderThan?.oldestTzktOperation.level
  });

const fetchOperations_Token_Fa_2 = (
  chainId: TzktApiChainId,
  accountAddress: string,
  contractAddress: string,
  tokenId = '0',
  pseudoLimit: number,
  olderThan?: Activity
) =>
  TZKT.fetchGetOperationsTransactions(chainId, {
    limit: pseudoLimit,
    entrypoint: 'transfer',
    'sort.desc': 'level',
    target: contractAddress,
    'parameter.[*].in': JSON.stringify([
      { from_: accountAddress, txs: [{ token_id: tokenId }] },
      { txs: [{ to_: accountAddress, token_id: tokenId }] }
    ]),
    'level.lt': olderThan?.oldestTzktOperation.level
  });

async function fetchOperations_Any(
  chainId: TzktApiChainId,
  accountAddress: string,
  pseudoLimit: number,
  olderThan?: Activity
) {
  const limit = pseudoLimit;

  const accOperations = await TZKT.fetchGetAccountOperations(chainId, accountAddress, {
    type: ['delegation', 'origination', 'transaction'],
    ...buildOlderThanParam(olderThan),
    limit,
    sort: 1
  });

  let newerThen: string | undefined = accOperations[accOperations.length - 1]?.timestamp;

  const fa12OperationsTransactions = await TZKT.refetchOnce429(
    () =>
      fetchIncomingOperTransactions_Fa_1_2(chainId, accountAddress, newerThen ? { newerThen } : { limit }, olderThan),
    1000
  );

  if (newerThen == null) {
    newerThen = fa12OperationsTransactions[accOperations.length - 1]?.timestamp;
  }

  const fa2OperationsTransactions = await TZKT.refetchOnce429(
    () => fetchIncomingOperTransactions_Fa_2(chainId, accountAddress, newerThen ? { newerThen } : { limit }, olderThan),
    1000
  );

  const allOperations = accOperations
    .concat(fa12OperationsTransactions, fa2OperationsTransactions)
    .sort((b, a) => a.id - b.id);

  return allOperations;
}

function fetchIncomingOperTransactions_Fa_1_2(
  chainId: TzktApiChainId,
  accountAddress: string,
  endLimitation: { limit: number } | { newerThen: string },
  olderThan?: Activity
) {
  const bottomParams = 'limit' in endLimitation ? endLimitation : { 'timestamp.ge': endLimitation.newerThen };

  return TZKT.fetchGetOperationsTransactions(chainId, {
    'sender.ne': accountAddress,
    'target.ne': accountAddress,
    'initiator.ne': accountAddress,
    'parameter.to': accountAddress,
    entrypoint: 'transfer',
    ...buildOlderThanParam(olderThan),
    ...bottomParams,
    'sort.desc': 'id'
  });
}

function fetchIncomingOperTransactions_Fa_2(
  chainId: TzktApiChainId,
  accountAddress: string,
  endLimitation: { limit: number } | { newerThen: string },
  olderThan?: Activity
) {
  const bottomParams = 'limit' in endLimitation ? endLimitation : { 'timestamp.ge': endLimitation.newerThen };

  return TZKT.fetchGetOperationsTransactions(chainId, {
    'sender.ne': accountAddress,
    'target.ne': accountAddress,
    'initiator.ne': accountAddress,
    'parameter.[*].txs.[*].to_': accountAddress,
    entrypoint: 'transfer',
    ...buildOlderThanParam(olderThan),
    ...bottomParams,
    'sort.desc': 'id'
  });
}

//// PRIVATE

/**
 * @return groups[number].operations // sorted new-to-old
 */
async function fetchOperGroupsForOperations(
  chainId: TzktApiChainId,
  operations: TzktOperation[],
  olderThan?: Activity
) {
  const uniqueHashes = filterUnique(operations.map(d => d.hash));

  if (olderThan && uniqueHashes[0] === olderThan.hash) uniqueHashes.splice(1);

  const groups: OperationsGroup[] = [];
  for (const hash of uniqueHashes) {
    const operations = await TZKT.refetchOnce429(() => TZKT.fetchGetOperationsByHash(chainId, hash), 1000);
    operations.sort((b, a) => a.id - b.id);
    groups.push({
      hash,
      operations
    });
  }

  return groups;
}

/**
 * > (!) When using `lastId` param, TZKT API might error with:
 * > `{"code":400,"errors":{"lastId":"The value '331626822238208' is not valid."}}`
 * > when it's not true!
 */
const buildOlderThanParam = (olderThan?: Activity) => ({ 'timestamp.lt': olderThan?.oldestTzktOperation?.timestamp });
