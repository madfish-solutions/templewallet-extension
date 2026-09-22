import { decodeFunctionData, hashMessage, isAddressEqual, parseAbi, type Hex } from 'viem';
import { entryPoint07Address, getUserOperationHash } from 'viem/account-abstraction';

import {
  AlchemyBatchQuote,
  AlchemyBatchRequest,
  AlchemyCall,
  AlchemyFeeOption,
  AlchemyPreparedCalls,
  AlchemyPreparedOperation
} from './types';

export const ALCHEMY_DELEGATION = '0x77021100bD87b7008E5E1989d0eB38555d0d0000';
export const ALCHEMY_DELEGATIONS = [ALCHEMY_DELEGATION] as const;
export const ALCHEMY_QUOTE_LIFETIME = 60_000;
export const ALCHEMY_FEE_MULTIPLIERS: Record<AlchemyFeeOption, number> = {
  slow: 0.7,
  mid: 0.85,
  fast: 1
};

export const isEip7702DelegationCode = (code: Hex): boolean => /^0xef0100[0-9a-f]{40}$/i.test(code);

const alchemyExecutionAbi = parseAbi([
  'function execute(address target, uint256 value, bytes data) payable returns (bytes)',
  'function executeBatch((address target, uint256 value, bytes data)[] calls) payable returns (bytes[])'
]);

export function getAlchemyOperation(prepared: AlchemyPreparedCalls): AlchemyPreparedOperation {
  if (prepared.type === 'array') {
    if (prepared.data.length !== 2 || prepared.data[0].type !== 'authorization') {
      throw new Error('Invalid Alchemy authorization batch');
    }
    return prepared.data[1];
  }
  return prepared;
}

export function getAlchemyMaxFee(prepared: AlchemyPreparedCalls): bigint {
  const { data } = getAlchemyOperation(prepared);

  return (
    (BigInt(data.callGasLimit) +
      BigInt(data.verificationGasLimit) +
      BigInt(data.preVerificationGas) +
      BigInt(data.paymasterVerificationGasLimit ?? '0x0') +
      BigInt(data.paymasterPostOpGasLimit ?? '0x0')) *
    BigInt(data.maxFeePerGas)
  );
}

export function getAlchemyMaxCost(quote: AlchemyBatchQuote, entryPointDeposit = 0n): bigint {
  const operation = getAlchemyOperation(quote.prepared);
  const prefund = operation.data.paymaster ? 0n : getAlchemyMaxFee(quote.prepared);
  const gasCost = prefund > entryPointDeposit ? prefund - entryPointDeposit : 0n;
  return quote.request.calls.reduce((cost, call) => cost + BigInt(call.value), gasCost);
}

export function addAlchemyGasParamsOverride(
  request: Omit<AlchemyBatchRequest, 'capabilities'>,
  feeOption: AlchemyFeeOption
): AlchemyBatchRequest {
  const multiplier = ALCHEMY_FEE_MULTIPLIERS[feeOption];

  return {
    ...request,
    capabilities: {
      eip7702Auth: {
        delegation: 'ModularAccountV2',
        version: 'v1.1.0'
      },
      gasParamsOverride: {
        maxFeePerGas: { multiplier },
        maxPriorityFeePerGas: { multiplier }
      }
    }
  };
}

function validateAlchemyCapabilities(quote: AlchemyBatchQuote): void {
  const expectedMultiplier = ALCHEMY_FEE_MULTIPLIERS[quote.feeOption];
  const capabilities = quote.request.capabilities;
  const override = capabilities?.gasParamsOverride;
  if (
    expectedMultiplier === undefined ||
    capabilities?.eip7702Auth.delegation !== 'ModularAccountV2' ||
    capabilities.eip7702Auth.version !== 'v1.1.0' ||
    !override ||
    override.maxFeePerGas.multiplier !== expectedMultiplier ||
    override.maxPriorityFeePerGas.multiplier !== expectedMultiplier
  ) {
    throw new Error('Invalid Alchemy request capabilities');
  }
}

function sameCall(actual: AlchemyCall, expected: AlchemyCall): boolean {
  return (
    isAddressEqual(actual.to, expected.to) &&
    actual.data.toLowerCase() === expected.data.toLowerCase() &&
    BigInt(actual.value) === BigInt(expected.value)
  );
}

export function validateAlchemyPreparedCalls(prepared: AlchemyPreparedCalls, request: AlchemyBatchRequest): Hex {
  const operation = getAlchemyOperation(prepared);
  if (operation.type !== 'user-operation-v070' || BigInt(operation.chainId) !== BigInt(request.chainId)) {
    throw new Error('Unsupported Alchemy operation or chain');
  }
  const data = operation.data;
  if (!isAddressEqual(data.sender, request.from) || data.factory || data.factoryData) {
    throw new Error('Alchemy changed the account');
  }
  if (prepared.type === 'array') {
    const authorization = prepared.data[0];
    if (
      BigInt(authorization.chainId) !== BigInt(request.chainId) ||
      !isAddressEqual(ALCHEMY_DELEGATION, authorization.data.address)
    ) {
      throw new Error('Untrusted Alchemy delegation');
    }
    const nonce = Number(BigInt(authorization.data.nonce));
    if (!Number.isSafeInteger(nonce) || nonce < 0) throw new Error('Invalid authorization nonce');
  }

  const callData = data.callData.toLowerCase().startsWith('0x8dd7712f')
    ? (`0x${data.callData.slice(10)}` as Hex)
    : data.callData;
  const decoded = decodeFunctionData({ abi: alchemyExecutionAbi, data: callData });
  const calls =
    decoded.functionName === 'executeBatch'
      ? decoded.args[0]
      : [{ target: decoded.args[0], value: decoded.args[1], data: decoded.args[2] }];
  const actualCalls: AlchemyCall[] = calls.map(call => ({
    to: call.target,
    data: call.data,
    value: `0x${call.value.toString(16)}`
  }));

  if (
    actualCalls.length !== request.calls.length ||
    actualCalls.some((call, index) => !sameCall(call, request.calls[index]))
  ) {
    throw new Error('Alchemy changed the batch calls');
  }
  const hash = getAlchemyOperationHash(operation);
  if (
    operation.signatureRequest?.type !== 'personal_sign' ||
    operation.signatureRequest.data.raw.toLowerCase() !== hash.toLowerCase() ||
    (operation.signatureRequest.rawPayload &&
      operation.signatureRequest.rawPayload.toLowerCase() !== hashMessage({ raw: hash }).toLowerCase())
  ) {
    throw new Error('Alchemy signature does not match the batch');
  }
  return hash;
}

export function validateAlchemyQuote(quote: AlchemyBatchQuote): Hex {
  if (
    !Number.isFinite(quote.expiresAt) ||
    Date.now() >= quote.expiresAt ||
    quote.expiresAt > Date.now() + ALCHEMY_QUOTE_LIFETIME
  ) {
    throw new Error('The fee quote expired. Retry to review a new quote.');
  }
  validateAlchemyCapabilities(quote);
  return validateAlchemyPreparedCalls(quote.prepared, quote.request);
}

export function getAlchemyOperationHash(operation: Pick<AlchemyPreparedOperation, 'data' | 'chainId'>): Hex {
  const { data } = operation;
  return getUserOperationHash({
    chainId: Number(BigInt(operation.chainId)),
    entryPointAddress: entryPoint07Address,
    entryPointVersion: '0.7',
    userOperation: {
      ...data,
      nonce: BigInt(data.nonce),
      callGasLimit: BigInt(data.callGasLimit),
      verificationGasLimit: BigInt(data.verificationGasLimit),
      preVerificationGas: BigInt(data.preVerificationGas),
      maxFeePerGas: BigInt(data.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(data.maxPriorityFeePerGas),
      paymasterVerificationGasLimit: data.paymasterVerificationGasLimit
        ? BigInt(data.paymasterVerificationGasLimit)
        : undefined,
      paymasterPostOpGasLimit: data.paymasterPostOpGasLimit ? BigInt(data.paymasterPostOpGasLimit) : undefined,
      signature: '0x'
    }
  });
}
