/* eslint-disable prettier/prettier */


import axios, { AxiosError } from 'axios';

import { TempleChainId } from 'lib/temple/types';

import type {
	// TzktGetOperationsParams,
	TzktOperation,
	TzktOperationType,
	TzktQuoteCurrency,

	_TzktOperation,
} from './types';


//// CHAIN ID

export const TZKT_API_BASE_URLS = {
	[TempleChainId.Mainnet]: 'https://api.tzkt.io/v1',
	[TempleChainId.Jakartanet]: 'https://api.jakartanet.tzkt.io/v1',
	[TempleChainId.Ghostnet]: 'https://api.ghostnet.tzkt.io/v1',
	[TempleChainId.Dcp]: 'https://explorer.tlnt.net:8001/v1',
	[TempleChainId.DcpTest]: 'https://explorer.tlnt.net:8009/v1',
};

export const TZKT_API_BASE_URLS_MAP = new Map(Object.entries(TZKT_API_BASE_URLS) as [TempleChainId, string][]);

export type TzktApiChainId = keyof typeof TZKT_API_BASE_URLS;

const _KNOWN_CHAIN_IDS = Object.keys(TZKT_API_BASE_URLS);

export function isKnownChainId(chainId?: string | null): chainId is TzktApiChainId {
	return chainId != null && _KNOWN_CHAIN_IDS.includes(chainId);
}

//// AXIOS API

const api = axios.create();

api.interceptors.response.use(
	res => res,
	err => {
		console.error(err);
		const { message } = (err as AxiosError).response?.data;
		throw new Error(`Failed when querying Tzkt API: ${message}`);
	}
);

export async function fetchGet<R>(
	chainId : TzktApiChainId,
	endpoint : string,
	params : Record<string, unknown>,
) {
	const { data } = await api.get<R>(
		endpoint,
		{
			baseURL: TZKT_API_BASE_URLS[chainId],
			params,
		}
	);

	return data;
}

export function makeQuery<P extends Record<string, unknown>, R, Q = Record<string, unknown>>(
	url: (params: P) => string,
	searchParams: (params: P) => Q
 ) {
	return async (chainId: TempleChainId, params: P) => {
		const { data } = await api.get<R>(url(params), {
			baseURL: TZKT_API_BASE_URLS_MAP.get(chainId),
			params: searchParams(params)
		});

		return data;
	};
}


////

type Param_Id = {
	id ? : number;
} & {
	[key in `id.${'lt'|'ge'}`] ? : number;
};

type Param_LimitOffset = {
	limit ? : number;
	offset ? : number;
};

type Param_Timestamp = {
	[key in `timestamp.${'lt'|'ge'}`] ? : string;
};

type Param_Level = {
	[key in `level.${'lt'|'ge'}`] ? : number;
};

export async function fetchGetAccountOperations(
	chainId : TzktApiChainId,
	accountAddress : string,
	params : Param_Id & Param_LimitOffset & Param_Timestamp & Param_Level & {
		type ? : TzktOperationType | TzktOperationType[];
		lastId ? : number;
		sort ? : 0 | 1;
		initiator ? : string;
		entrypoint ? : 'mintOrBurn',
		quote ? : TzktQuoteCurrency[];
		'parameter.null' ? : boolean;
	},
) {
	return await fetchGet<TzktOperation[]>(
		chainId,
		`/accounts/${accountAddress}/operations`,
		params,
	);
}

export async function fetchGetOperationsByHash(
	chainId : TzktApiChainId,
	hash : string,
	params : {
		quote ? : TzktQuoteCurrency[];
	} = {},
) {
	return await fetchGet<_TzktOperation[]>(
		chainId,
		`/operations/${hash}`,
		params,
	);
}

type Param_SortBy_Val_Type = 'id' | 'level';
type Param_SortBy = {
	sort ? : Param_SortBy_Val_Type;
	'sort.desc' ? : Param_SortBy_Val_Type;
};

export async function fetchGetOperationsTransactions(
	chainId : TzktApiChainId,
	params : Param_Id & Param_LimitOffset & Param_Timestamp & Param_Level & Param_SortBy & {
		'sender.ne' ? : string;
		'target' ? : string;
		'target.ne' ? : string;
		'initiator.ne' ? : string;
		'parameter.to' ? : string;
		'parameter.[*].txs.[*].to_' ? : string;
		'parameter.in' ? : string;
		'parameter.[*].in' ? : string;
		entrypoint ? : 'transfer';
		// quote ? : TzktQuoteCurrency[];
	},
) {
	type TzktOperationTransaction = TzktOperation; // (?) Can it be narrowed down for this endpoint?

	return await fetchGet<TzktOperationTransaction[]>(
		chainId,
		`/operations/transactions`,
		params,
	);
}



////

function delay(ms : number) {
	return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function refetchOnce429<R>(fetcher : () => Promise<R>, delay_ms = 1000) {
	try {
		return await fetcher();
	}
	catch(error) {
		if(typeof error?.code === 'string') {
			const $error : AxiosError = error;
			if($error.code === '429') {
				await delay(delay_ms);
				return await fetcher();
			}
		}

		throw error;
	}
}