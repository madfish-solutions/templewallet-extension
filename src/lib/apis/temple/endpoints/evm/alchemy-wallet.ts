import type { Hex } from 'viem';

import type {
  AlchemyBatchRequest,
  AlchemyCallsStatus,
  AlchemyPreparedCalls,
  AlchemySignedCalls,
  AlchemyWalletConfig
} from 'lib/evm/alchemy/types';

import { templeWalletApi } from '../templewallet.api';

interface RpcResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

export class AlchemyRpcError extends Error {
  constructor(
    readonly code: number,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(method: string, body: object, signal?: AbortSignal): Promise<T> {
  const { data } = await templeWalletApi.post<RpcResponse<T>>(`evm/alchemy/${method}`, body, {
    signal,
    timeout: 30_000
  });
  if (data.error) throw new AlchemyRpcError(data.error.code, data.error.message);
  if (data.result === undefined) throw new Error('Alchemy returned an empty response');
  return data.result;
}

export async function getAlchemyWalletConfig(signal?: AbortSignal): Promise<AlchemyWalletConfig> {
  const { data } = await templeWalletApi.get<AlchemyWalletConfig>('evm/alchemy/config', { signal, timeout: 10_000 });
  return data;
}

export const prepareAlchemyCalls = (body: AlchemyBatchRequest, signal?: AbortSignal): Promise<AlchemyPreparedCalls> =>
  request('wallet_prepareCalls', body, signal);

export const sendAlchemyCalls = (body: AlchemySignedCalls): Promise<{ id: Hex }> =>
  request('wallet_sendPreparedCalls', body);

export const getAlchemyCallsStatus = (callId: Hex): Promise<AlchemyCallsStatus> =>
  request('wallet_getCallsStatus', { callId });
