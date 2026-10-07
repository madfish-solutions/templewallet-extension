import type { Address, Hex } from 'viem';

export type AlchemyFeeOption = 'slow' | 'mid' | 'fast';

interface AlchemyGasParamsOverride {
  maxFeePerGas: { multiplier: number };
  maxPriorityFeePerGas: { multiplier: number };
}

interface AlchemyEip7702Auth {
  delegation: 'ModularAccountV2';
  version: 'v1.1.0';
}

export interface AlchemyCall {
  to: Address;
  data: Hex;
  value: Hex;
}

export interface AlchemyWalletConfig {
  chains: number[];
}

export interface AlchemyBatchRequest {
  from: Address;
  chainId: Hex;
  calls: AlchemyCall[];
  capabilities?: {
    eip7702Auth: AlchemyEip7702Auth;
    gasParamsOverride: AlchemyGasParamsOverride;
  };
}

interface AlchemyUserOperation {
  sender: Address;
  nonce: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  factory?: Address;
  factoryData?: Hex;
  paymaster?: Address;
  paymasterData?: Hex;
  paymasterVerificationGasLimit?: Hex;
  paymasterPostOpGasLimit?: Hex;
}

export interface AlchemyPreparedOperation {
  type: 'user-operation-v070';
  chainId: Hex;
  data: AlchemyUserOperation;
  signatureRequest: { type: 'personal_sign'; data: { raw: Hex }; rawPayload?: Hex };
}

interface AlchemyPreparedAuthorization {
  type: 'authorization';
  chainId: Hex;
  data: { address: Address; nonce: Hex };
}

export type AlchemyPreparedCalls =
  | AlchemyPreparedOperation
  | { type: 'array'; data: [AlchemyPreparedAuthorization, AlchemyPreparedOperation] };

export interface AlchemySignedItem {
  type: 'authorization' | 'user-operation-v070';
  chainId: Hex;
  data: AlchemyPreparedAuthorization['data'] | AlchemyUserOperation;
  signature: { type: 'secp256k1'; data: Hex };
}

export type AlchemySignedCalls = AlchemySignedItem | { type: 'array'; data: AlchemySignedItem[] };

export interface AlchemyCallsStatus {
  id: Hex;
  chainId: Hex;
  atomic: boolean;
  status: number;
  receipts?: { status: Hex; transactionHash: Hex }[] | null;
}

export interface AlchemyBatchQuote {
  request: AlchemyBatchRequest;
  prepared: AlchemyPreparedCalls;
  /** Minimum native amount paid to the account after each indexed call. */
  minNativeReceivedByCall?: Record<number, Hex>;
  expiresAt: number;
  feeOption: AlchemyFeeOption;
}
