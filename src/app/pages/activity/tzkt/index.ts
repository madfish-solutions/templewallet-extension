/* eslint-disable prettier/prettier */



import { TempleChainId } from 'lib/temple/types';

import type {
	// TzktGetOperationsParams,
	TzktOperation,
	TzktOperationType,
	TzktQuoteCurrency,

	_TzktOperation,
} from './types';



const TZKT_API_BASE_URLS = {
	[TempleChainId.Mainnet]: 'https://api.tzkt.io/v1',
	[TempleChainId.Jakartanet]: 'https://api.jakartanet.tzkt.io/v1',
	[TempleChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
	[TempleChainId.Dcp]: 'https://explorer.tlnt.net:8001/v1',
	[TempleChainId.DcpTest]: 'https://explorer.tlnt.net:8009/v1',
};

export type TzktApiChainId = keyof typeof TZKT_API_BASE_URLS;

const _KNOWN_CHAIN_IDS = Object.keys(TZKT_API_BASE_URLS);



////

export function isKnownChainId(chainId ? : string | null) : chainId is TzktApiChainId {
	return chainId != null && _KNOWN_CHAIN_IDS.includes(chainId);
}


//

export async function fetchGetAccountOperations(
	chainId : TzktApiChainId,
	accountAddress : string,
	params : {
		type ? : TzktOperationType | TzktOperationType[];
		'id.lt' ? : number;
		'id.ge' ? : number;
		'timestamp.lt' ? : string;
		'timestamp.ge' ? : string;
		'level.lt' ? : number;
		'level.ge' ? : number;
		lastId ? : number;
		limit ? : number;
		offset ? : number;
		sort ? : 0 | 1;
		initiator ? : string;
		entrypoint ? : 'mintOrBurn',
		quote ? : TzktQuoteCurrency[];
		'parameter.null' ? : boolean;
	},
) {
	const url = TZKT_API_BASE_URLS[chainId] + `/accounts/${accountAddress}/operations`;
	//
	return await fetchJSON<TzktOperation[]>(url, 'GET', params || {});
}

export async function fetchGetOperationsByHash(
	chainId : TzktApiChainId,
	hash : string,
	params ? : {
		quote ? : TzktQuoteCurrency[];
	},
) {
	const url = TZKT_API_BASE_URLS[chainId] + `/operations/${hash}`;
	//
	return await fetchJSON<_TzktOperation[]>(url, 'GET', params || {});
}

export async function fetchGetOperationsTransactions(
	chainId : TzktApiChainId,
	params : {
		// type ? : TzktOperationType[];
		'sender.ne' ? : string;
		'target.ne' ? : string;
		'initiator.ne' ? : string;
		'parameter.to' ? : string;
		'parameter.[*].txs.[*].to_' ? : string;
		'id.lt' ? : number;
		'id.gt' ? : number;
		'timestamp.lt' ? : string;
		'timestamp.ge' ? : string;
		entrypoint ? : 'transfer';
		limit ? : number;
		offset ? : number;
		sort ? : 'id';
		'sort.desc' ? : 'id';
		// quote ? : TzktQuoteCurrency[];
	},
) {
	const url = TZKT_API_BASE_URLS[chainId] + `/operations/transactions`;

	type TzktOperationTransaction = TzktOperation; // (?) Can it be narrowed down for this endpoint?

	return await fetchJSON<TzktOperationTransaction[]>(url, 'GET', params || {});
}




//// FETCHER

async function fetch(
	url : string,
	method : 'GET' = 'GET',
	params : Record<string, unknown>,
) {
	const fullURL = params ? url += queryParamsToStr(params) : url;
	const reqConfig : RequestInit = {
		method,
	};
	const request = new Request( fullURL, reqConfig );
	//
	const response = await globalThis.fetch(request);
	//
	if(response.ok === false) throw new Error('Error: Response not okay');
	//
	return response;
}

async function fetchJSON<T = any>(
	url : string,
	method : 'GET' = 'GET',
	params : Record<string, unknown>,
) {
	const response = await fetch(url, method, params);
	//
	const result : T = await response.json();
	//
	return result;
}



function queryParamsToStr(params : Record<string, unknown>) : string {
	if(params == null || typeof params !== 'object') return '';
	// const query = Object.keys(params).map(k => encodeURIComponent(k)+'='+encodeURIComponent(JSON.stringify(params[k])) ).join('&');
	// (i) Look into URLSearchParams
	const keys = Object.keys(params);
	// if(keys.length) path += '?' + keys.map(k =>
	//	 k + '=' + ( typeof params[k] === 'object' ? JSON.stringify(params[k]) : String(params[k]) )
	// ).join('&');
	if(keys.length) return '?' + keys.map(key => {
		const _val = params[key]!;
		const val = Array.isArray(_val)
			? _val
			: typeof _val === 'object'
				? JSON.stringify(_val)
				: _val as any;
		return encodeURIComponent(key) + '=' + encodeURIComponent(val);
	}).join('&');
	//
	return '';
}