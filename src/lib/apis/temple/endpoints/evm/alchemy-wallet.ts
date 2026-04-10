import axios from 'axios';
import { SignableMessage, TypedDataDefinition } from 'viem';

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
  onlyEstimation?: boolean;
  [key: string]: unknown;
}

// https://www.alchemy.com/docs/wallets/api-reference/smart-wallets/wallet-api-endpoints/wallet-api-endpoints/wallet-send-prepared-calls
export interface WalletSendPreparedCallsRequest {
  type: string;
  data: unknown;
  chainId?: string;
  signature?: {
    type: 'secp256k1';
    data: HexString;
  };
  [key: string]: unknown;
}

// https://www.alchemy.com/docs/wallets/api-reference/smart-wallets/wallet-api-endpoints/wallet-api-endpoints/wallet-get-calls-status
export interface WalletGetCallsStatusRequest {
  callId: string;
}

export interface AlchemyFeePayment {
  amount?: string;
  maxAmount: HexString;
  tokenAddress?: HexString;
}

export interface AlchemyMessageSignatureRequest {
  type: 'personal_sign';
  data: SignableMessage;
  rawPayload?: HexString;
}

export interface AlchemyTypedDataSignatureRequest {
  type: 'eth_signTypedData_v4';
  data: TypedDataDefinition;
  rawPayload?: HexString;
}

export interface AlchemyAuthorizationSignatureRequest {
  type: 'authorization';
  data: {
    address?: HexString;
    contractAddress?: HexString;
    chainId: number;
    nonce: number;
  };
  rawPayload?: HexString;
}

export type AlchemySignatureRequest =
  | AlchemyMessageSignatureRequest
  | AlchemyTypedDataSignatureRequest
  | AlchemyAuthorizationSignatureRequest;

export interface AlchemyPreparedCallBase {
  type: string;
  data: unknown;
  chainId?: string;
  signatureRequest: AlchemySignatureRequest;
}

export interface AlchemyPreparedCallSingle extends AlchemyPreparedCallBase {
  feePayment?: AlchemyFeePayment;
}

export interface AlchemyPreparedCallArray {
  type: 'array';
  data: AlchemyPreparedCallBase[];
  feePayment?: AlchemyFeePayment;
}

export type AlchemyPrepareCallsResult = AlchemyPreparedCallSingle | AlchemyPreparedCallArray;

export interface AlchemySendPreparedCallsResult {
  id: string;
}

export interface AlchemyCallsStatusReceipt {
  status?: string;
  transactionHash?: HexString;
  [key: string]: unknown;
}

export interface AlchemyCallsStatusResult {
  id: string;
  chainId: string;
  atomic: boolean;
  status: number;
  receipts: AlchemyCallsStatusReceipt[] | null;
  errors?: unknown;
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
