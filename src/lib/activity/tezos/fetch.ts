import type { TzktApiChainId, TzktOperation } from 'lib/apis/tzkt';
import * as TZKT from 'lib/apis/tzkt';
import { refetchOnce429 } from 'lib/apis/utils';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { detectTokenStandard } from 'lib/assets/standards';
import { filterUnique } from 'lib/utils';
import { getReadOnlyTezos } from 'temple/tezos';

import type { TempleTzktOperationsGroup, TezosActivityOlderThan } from './types';

const LIQUIDITY_BAKING_DEX_ADDRESS = 'KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5';

/**
 * Returned items are sorted new-to-old.
 *
 * @arg pseudoLimit // Is pseudo, because, number of returned activities is not guarantied to equal to it.
 * 	It can also be smaller, even when older items are available (they can be fetched later).
 */
export async function fetchOperations(
  chainId: TzktApiChainId,
  rpcUrl: string,
  accAddress: string,
  assetSlug: string | undefined,
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
): Promise<TzktOperation[]> {
  if (assetSlug) {
    const [contractAddress, tokenId] = (assetSlug ?? '').split('_');

    if (assetSlug === TEZ_TOKEN_SLUG) {
      return await fetchOperations_TEZ(chainId, accAddress, pseudoLimit, olderThan);
    } else if (contractAddress === LIQUIDITY_BAKING_DEX_ADDRESS) {
      return await fetchOperations_Contract(chainId, accAddress, contractAddress, pseudoLimit, olderThan);
    } else {
      const tezos = getReadOnlyTezos(rpcUrl);
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
  olderThan?: TezosActivityOlderThan
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
  contractAddress: string,
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
) =>
  TZKT.fetchGetOperationsTransactions(chainId, {
    target: contractAddress,
    initiator: accountAddress,
    limit: pseudoLimit,
    entrypoint: 'mintOrBurn',
    'sort.desc': 'level',
    'level.lt': olderThan?.oldestTzktOperation.level
  });

const fetchOperations_Token_Fa_1_2 = (
  chainId: TzktApiChainId,
  accountAddress: string,
  contractAddress: string,
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
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
  olderThan?: TezosActivityOlderThan
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
  olderThan?: TezosActivityOlderThan
) {
  const limit = pseudoLimit;

  const accOperations = await TZKT.fetchGetAccountOperations(chainId, accountAddress, {
    types: ['delegation', 'origination', 'transaction'],
    ...buildOlderThanParam(olderThan),
    limit,
    sort: 1
  });

  let newerThen: string | undefined = accOperations[accOperations.length - 1]?.timestamp;

  const fa12OperationsTransactions = await refetchOnce429(
    () =>
      fetchIncomingOperTransactions_Fa_1_2(chainId, accountAddress, newerThen ? { newerThen } : { limit }, olderThan),
    1000
  );

  if (newerThen == null) {
    newerThen = fa12OperationsTransactions[accOperations.length - 1]?.timestamp;
  }

  const fa2OperationsTransactions = await refetchOnce429(
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
  olderThan?: TezosActivityOlderThan
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
  olderThan?: TezosActivityOlderThan
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
export async function fetchOperGroupsForOperations(
  chainId: TzktApiChainId,
  hashes: string[],
  olderThan?: TezosActivityOlderThan
) {
  const uniqueHashes = filterUnique(hashes);

  if (olderThan && uniqueHashes[0] === olderThan.hash) uniqueHashes.splice(1);

  const groups: TempleTzktOperationsGroup[] = [];
  for (const hash of uniqueHashes) {
    const operations = await refetchOnce429(() => TZKT.fetchGetOperationsByHash(chainId, hash), 1000);

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
const buildOlderThanParam = (olderThan?: TezosActivityOlderThan) => ({
  'timestamp.lt': olderThan?.oldestTzktOperation?.timestamp
});
