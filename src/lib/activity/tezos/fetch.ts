import type {
  GetAccountOperationsParams,
  GetOperationsTransactionsParams,
  TzktApiChainId,
  TzktOperation
} from 'lib/apis/tzkt';
import * as TZKT from 'lib/apis/tzkt';
import { refetchOnce429 } from 'lib/apis/utils';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { detectTokenStandard } from 'lib/assets/standards';
import { filterUnique } from 'lib/utils';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';

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
      const tezos = getTezosReadOnlyRpcClient({ rpcBaseURL: rpcUrl, chainId });
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
  fetchTransactionsPage(
    chainId,
    { 'anyof.sender.target.initiator': accountAddress, 'amount.ne': '0' },
    buildOlderThanParam(olderThan),
    pseudoLimit
  );

const fetchOperations_Contract = (
  chainId: TzktApiChainId,
  accountAddress: string,
  contractAddress: string,
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
) =>
  fetchTransactionsPage(
    chainId,
    { target: contractAddress, initiator: accountAddress, entrypoint: 'mintOrBurn' },
    buildOlderThanLevelParam(olderThan),
    pseudoLimit
  );

const fetchOperations_Token_Fa_1_2 = (
  chainId: TzktApiChainId,
  accountAddress: string,
  contractAddress: string,
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
) =>
  fetchTransactionsPage(
    chainId,
    {
      entrypoint: 'transfer',
      target: contractAddress,
      'parameter.in': `[{"from":"${accountAddress}"},{"to":"${accountAddress}"}]`
    },
    buildOlderThanLevelParam(olderThan),
    pseudoLimit
  );

const fetchOperations_Token_Fa_2 = (
  chainId: TzktApiChainId,
  accountAddress: string,
  contractAddress: string,
  tokenId = '0',
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
) =>
  fetchTransactionsPage(
    chainId,
    {
      entrypoint: 'transfer',
      target: contractAddress,
      'parameter.[*].in': JSON.stringify([
        { from_: accountAddress, txs: [{ token_id: tokenId }] },
        { txs: [{ to_: accountAddress, token_id: tokenId }] }
      ])
    },
    buildOlderThanLevelParam(olderThan),
    pseudoLimit
  );

async function fetchOperations_Any(
  chainId: TzktApiChainId,
  accountAddress: string,
  pseudoLimit: number,
  olderThan?: TezosActivityOlderThan
) {
  const limit = pseudoLimit;

  const fetchAccountOperations = (params: GetAccountOperationsParams) =>
    TZKT.fetchGetAccountOperations(chainId, accountAddress, {
      types: ['delegation', 'origination', 'transaction'],
      sort: 1,
      ...params
    });

  const accOperations = await withRestOfOldestBlock(
    await fetchAccountOperations({ ...buildOlderThanParam(olderThan), limit }),
    limit,
    oldest => fetchAccountOperations({ lastId: oldest.id, 'timestamp.ge': oldest.timestamp, limit: 1000 })
  );

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
export async function fetchOperGroupsForOperations(chainId: TzktApiChainId, hashes: string[]) {
  const uniqueHashes = filterUnique(hashes);

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

const buildOlderThanParam = (olderThan?: TezosActivityOlderThan) => ({
  'timestamp.lt': olderThan?.oldestTzktOperation?.timestamp
});

const buildOlderThanLevelParam = (olderThan?: TezosActivityOlderThan) => ({
  'level.lt': olderThan?.oldestTzktOperation.level
});

const fetchTransactionsPage = async (
  chainId: TzktApiChainId,
  baseParams: GetOperationsTransactionsParams,
  olderThanParams: GetOperationsTransactionsParams,
  pseudoLimit: number
) => {
  const fetchTransactions = (params: GetOperationsTransactionsParams) =>
    TZKT.fetchGetOperationsTransactions(chainId, { ...baseParams, 'sort.desc': 'id', ...params });

  return withRestOfOldestBlock(
    await fetchTransactions({ ...olderThanParams, limit: pseudoLimit }),
    pseudoLimit,
    oldest => fetchTransactions({ 'id.lt': oldest.id, 'timestamp.ge': oldest.timestamp, limit: 1000 })
  );
};

const withRestOfOldestBlock = async (
  operations: TzktOperation[],
  limit: number,
  fetchRest: (oldest: TzktOperation) => Promise<TzktOperation[]>
) => {
  const oldest = operations.at(-1);

  return oldest && operations.length >= limit
    ? operations.concat(await refetchOnce429(() => fetchRest(oldest), 1000))
    : operations;
};
