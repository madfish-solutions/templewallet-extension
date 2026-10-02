import axios from 'axios';
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
  error?: { code: number; message: string; data?: unknown };
}

export const ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE = 'Alchemy submission response timed out';
export const ALCHEMY_SUBMISSION_NETWORK_ERROR_MESSAGE = 'Alchemy submission response unavailable';

export const getAlchemySubmissionFailureReason = (error: unknown): 'timeout' | 'network' | undefined => {
  if (typeof error !== 'object' || error === null || !('message' in error)) return;
  if (error.message === ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE) return 'timeout';
  if (error.message === ALCHEMY_SUBMISSION_NETWORK_ERROR_MESSAGE) return 'network';
  return;
};

export class AlchemyRpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly data?: unknown
  ) {
    super(message);
  }
}

async function request<T>(method: string, body: object, signal?: AbortSignal): Promise<T> {
  const { data } = await templeWalletApi.post<RpcResponse<T>>(`evm/alchemy/${method}`, body, {
    signal,
    timeout: 30_000
  });
  if (data.error) throw new AlchemyRpcError(data.error.code, data.error.message, data.error.data);
  if (data.result === undefined) throw new Error('Alchemy returned an empty response');
  return data.result;
}

export async function getAlchemyWalletConfig(signal?: AbortSignal): Promise<AlchemyWalletConfig> {
  const { data } = await templeWalletApi.get<AlchemyWalletConfig>('evm/alchemy/config', { signal, timeout: 10_000 });
  return data;
}

export const prepareAlchemyCalls = (body: AlchemyBatchRequest, signal?: AbortSignal): Promise<AlchemyPreparedCalls> =>
  request('wallet_prepareCalls', body, signal);

export const sendAlchemyCalls = async (body: AlchemySignedCalls): Promise<{ id: Hex }> => {
  try {
    return await request('wallet_sendPreparedCalls', body);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error(ALCHEMY_SUBMISSION_TIMEOUT_MESSAGE);
      }
      if (error.code === 'ERR_NETWORK') throw new Error(ALCHEMY_SUBMISSION_NETWORK_ERROR_MESSAGE);
    }
    throw error;
  }
};

export const getAlchemyCallsStatus = (callId: Hex, signal?: AbortSignal): Promise<AlchemyCallsStatus> =>
  request('wallet_getCallsStatus', { callId }, signal);
