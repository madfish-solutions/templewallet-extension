/* eslint-disable prettier/prettier */
/* eslint-disable import/order */


import { useExplorerBaseUrls } from 'lib/temple/front';

import type {
	TzktApiChainId,
} from './tzkt';
import * as TZKT from './tzkt';

import type {
	TzktOperation,
	// _TzktOperation
} from './tzkt/types';

import {
	Activity,
	OperGroup,
	operGroupToActivity,
} from './utils';


////
const TEZ_TOKEN_SLUG = 'tez';
const LIQUIDITY_BAKING_DEX_ADDRESS = 'KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5';


////

export default async function fetchActivities(
	chainId : TzktApiChainId,
	accountAddress : string,
	assetSlug : string | undefined,
	pseudoLimit : number,
	olderThan ? : Activity,
) : Promise<Activity[]> {
	let groups : OperGroup[];

	if(assetSlug != null) {
		const [contractAddress, tokenId] = (assetSlug ?? '').split('_');
		if(assetSlug === TEZ_TOKEN_SLUG) {
			groups = await fetchOperGroups_TEZ(
				chainId,
				accountAddress,
				pseudoLimit,
				olderThan,
			);
		}
		else if(assetSlug === LIQUIDITY_BAKING_DEX_ADDRESS) {
			groups = await fetchOperGroups_Contract(
				chainId,
				accountAddress,
				pseudoLimit,
				olderThan,
			);
		}
		else {
			// const tezos = createReadOnlyTezosToolkit(selectedRpcUrl, selectedAccount);
		}
	}

	groups = await fetchOperGroups_Any(
		chainId,
		accountAddress,
		pseudoLimit,
		olderThan,
	);

	return groups.map( group =>
		operGroupToActivity(group, accountAddress)
	);
}


////

async function fetchOperGroups_TEZ(
	chainId : TzktApiChainId,
	accountAddress : string,
	pseudoLimit : number,
	// olderThan ? : string, // : ISO date
	olderThan ? : Activity,
) {
	const olderThanId = olderThan?.operations[olderThan.operations.length-1]?.id;

	const accOperations = await TZKT.fetchGetAccountOperations(
		chainId,
		accountAddress,
		{
			type: 'transaction',
			...( olderThanId != null ? { 'id.lt': olderThanId } : {} ),
			limit: pseudoLimit,
			sort: 1,
			'parameter.null': true,
		},
	);

	return await _fetchOperGroupsForOperations(
		chainId,
		accOperations,
		olderThan,
	);
}

async function fetchOperGroups_Contract(
	chainId : TzktApiChainId,
	accountAddress : string,
	pseudoLimit : number,
	// olderThan ? : string, // : ISO date
	olderThan ? : Activity,
) {
	const olderThanLevel = olderThan?.operations[olderThan.operations.length-1]?.level;

	const accOperations = await TZKT.fetchGetAccountOperations(
		chainId,
		accountAddress,
		{
			type: 'transaction',
			limit: pseudoLimit,
			sort: 1,
			initiator: accountAddress,
			entrypoint: 'mintOrBurn',
			...( olderThanLevel != null ? { 'level.lt': olderThanLevel } : {} ),
		},
	);

	return await _fetchOperGroupsForOperations(
		chainId,
		accOperations,
		olderThan,
	);
}

/**
 * Returned items are sorted new-to-old.
 *
 * @arg pseudoLimit // Is pseudo, because, number of returned activities is not guarantied to equal to it.
 * 	It can also be smaller, even when older items are available (they can be fetched later).
 * @return activities.operations // not necessarily sorted new-to-old
 */
async function fetchOperGroups_Any(
	chainId : TzktApiChainId,
	accountAddress : string,
	pseudoLimit : number,
	// olderThan ? : string, // : ISO Date
	olderThan ? : Activity,
) {
	const limit = pseudoLimit;
	const olderThanId = olderThan?.operations[olderThan.operations.length-1]?.id;

	const accOperations = await TZKT.fetchGetAccountOperations(
		chainId,
		accountAddress,
		{
			type: [
				'delegation', 'origination', 'transaction',
				// 'reveal'
			],
			// ...( olderThan ? { 'timestamp.lt': olderThan } : {} ),
			...( olderThanId != null ? { 'id.lt': olderThanId } : {} ),
			limit,
			sort: 1,
		},
	);

	let newerThen : string | undefined = accOperations[accOperations.length-1]?.timestamp;

	await delay(1);
	const fa12OperationsTransactions = await fetchFa12OperationsTransactions(
		chainId,
		accountAddress,
		newerThen ? { newerThen } : { limit },
		olderThanId,
	);

	if(newerThen == null) {
		newerThen = fa12OperationsTransactions[accOperations.length-1]?.timestamp
	}

	await delay(1);
	const fa2OperationsTransactions = await fetchFa2OperationsTransactions(
		chainId,
		accountAddress,
		newerThen ? { newerThen } : { limit },
		olderThanId,
	);

	const allOperations = accOperations.concat(
		fa12OperationsTransactions,
		fa2OperationsTransactions,
	).sort((b, a) => a.id - b.id);

	return await _fetchOperGroupsForOperations(
		chainId,
		allOperations,
		olderThan,
	);
}



////

/**
 * Returned items are sorted new-to-old.
 */
async function fetchFa12OperationsTransactions(
	chainId : TzktApiChainId,
	accountAddress : string,
	endLimitation : ({
		limit : number;
	} | {
		newerThen : string;
	}),
	// olderThan ? : string, // : ISO date
	olderThanId ? : number,
) {
	const bottomParams = 'limit' in endLimitation
		? endLimitation
		: { 'timestamp.ge': endLimitation.newerThen };

	const result = TZKT.fetchGetOperationsTransactions(
		chainId,
		{
			'sender.ne': accountAddress,
			'target.ne': accountAddress,
			'initiator.ne': accountAddress,
			'parameter.to': accountAddress,
			entrypoint: 'transfer',
			// ...( olderThan ? { 'timestamp.lt': olderThan } : {} ),
			...( olderThanId != null ? { 'id.lt': olderThanId } : {} ),
			...bottomParams,
			'sort.desc': 'id',
		},
	);

	// return result.sort((b, a) => a.id - b.id);
	return result;
}

/**
 * Returned items are sorted new-to-old.
 */
async function fetchFa2OperationsTransactions(
	chainId : TzktApiChainId,
	accountAddress : string,
	endLimitation : ({
		limit : number;
	} | {
		newerThen : string;
	}),
	// olderThan ? : string, // : ISO date
	olderThanId ? : number,
) {
	const bottomParams = 'limit' in endLimitation
		? endLimitation
		: { 'timestamp.ge': endLimitation.newerThen };

	const result = await TZKT.fetchGetOperationsTransactions(
		chainId,
		{
			'sender.ne': accountAddress,
			'target.ne': accountAddress,
			'initiator.ne': accountAddress,
			'parameter.[*].txs.[*].to_': accountAddress,
			entrypoint: 'transfer',
			// ...( olderThan ? { 'timestamp.lt': olderThan } : {} ),
			...( olderThanId != null ? { 'id.lt': olderThanId } : {} ),
			...bottomParams,
			'sort.desc': 'id',
		},
	);

	// return result.sort((b, a) => a.id - b.id);
	return result;
}


//// PRIVATE

async function _fetchOperGroupsForOperations(
	chainId : TzktApiChainId,
	operations : TzktOperation[],
	olderThan ? : Activity,
) {
	const allHashes = operations.map(d => d.hash);
	if(
		olderThan
		&& allHashes[allHashes.length-1] === olderThan.hash
	) allHashes.splice(-1);

	const uniqueHashes : string[] = [];
	for(const hash of allHashes) {
		if(uniqueHashes.includes(hash) === false) uniqueHashes.push(hash);
	}

	const groups : OperGroup[] = [];
	for(const hash of uniqueHashes) {
		await delay(1);
		const operations = await TZKT.fetchGetOperationsByHash(chainId, hash);
		groups.push({
			hash,
			operations,
		});
	}

	return groups;
}

function delay(seconds : number) {
	return new Promise<void>(resolve => setTimeout(resolve, seconds * 1000));
}