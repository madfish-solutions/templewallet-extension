import axios from 'axios';

import { templeWalletApi } from '../templewallet.api';

export interface AlchemyJsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface AlchemyJsonRpcResponse<TResult = unknown> {
  id: number | string;
  jsonrpc: string;
  result?: TResult;
  error?: AlchemyJsonRpcError;
}

// https://www.alchemy.com/docs/wallets/api-reference/smart-wallets/wallet-api-endpoints/wallet-api-endpoints/wallet-prepare-calls
// "capabilities" are handled by the backend, just pass "paymasterService": "true"
export interface WalletPrepareCallsRequest {
  chainId: string;
  paymasterService?: boolean;
  [key: string]: unknown;
}

// https://www.alchemy.com/docs/wallets/api-reference/smart-wallets/wallet-api-endpoints/wallet-api-endpoints/wallet-send-prepared-calls
export interface WalletSendPreparedCallsRequest {
  chainId: string;
  data: {
    sender?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// https://www.alchemy.com/docs/wallets/api-reference/smart-wallets/wallet-api-endpoints/wallet-api-endpoints/wallet-get-calls-status
export interface WalletGetCallsStatusRequest {
  callId: string;
}

const postAlchemyWalletRequest = <TResult>(path: string, body: object, signal?: AbortSignal) =>
  templeWalletApi.post<AlchemyJsonRpcResponse<TResult>>(`evm${path}`, body, { signal }).then(
    res => res.data,
    error => {
      if (axios.isCancel(error) || error?.name === 'CanceledError') return;
      console.error(error);
      throw error;
    }
  );

export const prepareAlchemyWalletCalls = <TResult = unknown>(body: WalletPrepareCallsRequest, signal?: AbortSignal) =>
  postAlchemyWalletRequest<TResult>('/alchemy/wallet_prepareCalls', body, signal);

export const sendAlchemyPreparedCalls = <TResult = unknown>(
  body: WalletSendPreparedCallsRequest,
  signal?: AbortSignal
) => postAlchemyWalletRequest<TResult>('/alchemy/wallet_sendPreparedCalls', body, signal);

export const getAlchemyCallsStatus = <TResult = unknown>(body: WalletGetCallsStatusRequest, signal?: AbortSignal) =>
  postAlchemyWalletRequest<TResult>('/alchemy/wallet_getCallsStatus', body, signal);
