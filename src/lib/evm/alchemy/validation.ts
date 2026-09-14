import { decodeFunctionData, erc20Abi, hashMessage, isAddressEqual, parseAbi, zeroAddress, type Hex } from 'viem';
import { entryPoint07Address, getUserOperationHash } from 'viem/account-abstraction';

import {
  AlchemyBatchQuote,
  AlchemyBatchRequest,
  AlchemyCall,
  AlchemyFeeToken,
  AlchemyPreparedCalls,
  AlchemyPreparedOperation
} from './types';

export const ALCHEMY_DELEGATIONS = [
  '0x69007702764179f14F51cdce752f4f775d74E139',
  '0x77021100bD87b7008E5E1989d0eB38555d0d0000'
] as const;
export const ALCHEMY_QUOTE_LIFETIME = 60_000;

export const alchemyExecutionAbi = parseAbi([
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
  const operation = getAlchemyOperation(prepared);
  if (operation.feePayment?.tokenAddress && !isAddressEqual(operation.feePayment.tokenAddress, zeroAddress)) {
    return BigInt(operation.feePayment.maxAmount);
  }
  const data = operation.data;
  const maximum =
    (BigInt(data.callGasLimit) +
      BigInt(data.verificationGasLimit) +
      BigInt(data.preVerificationGas) +
      BigInt(data.paymasterVerificationGasLimit ?? '0x0') +
      BigInt(data.paymasterPostOpGasLimit ?? '0x0')) *
    BigInt(data.maxFeePerGas);
  const quoted = BigInt(operation.feePayment?.maxAmount ?? '0x0');
  return quoted > maximum ? quoted : maximum;
}

function sameCall(actual: AlchemyCall, expected: AlchemyCall): boolean {
  return (
    isAddressEqual(actual.to, expected.to) &&
    actual.data.toLowerCase() === expected.data.toLowerCase() &&
    BigInt(actual.value) === BigInt(expected.value)
  );
}

export function validateAlchemyPreparedCalls(
  prepared: AlchemyPreparedCalls,
  request: AlchemyBatchRequest,
  feeToken?: AlchemyFeeToken
): Hex {
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
      !ALCHEMY_DELEGATIONS.some(address => isAddressEqual(address, authorization.data.address))
    ) {
      throw new Error('Untrusted Alchemy delegation');
    }
    const nonce = Number(BigInt(authorization.data.nonce));
    if (!Number.isSafeInteger(nonce) || nonce < 0) throw new Error('Invalid authorization nonce');
  }
  const fee = operation.feePayment;
  if (request.feeToken) {
    if (
      !fee?.tokenAddress ||
      !isAddressEqual(fee.tokenAddress, request.feeToken) ||
      !data.paymaster ||
      fee.sponsored ||
      !feeToken ||
      !isAddressEqual(feeToken.address, request.feeToken) ||
      !isAddressEqual(feeToken.paymaster, data.paymaster)
    ) {
      throw new Error('Alchemy changed the fee token');
    }
  } else if (data.paymaster || (fee?.tokenAddress && !isAddressEqual(fee.tokenAddress, zeroAddress))) {
    throw new Error('Unexpected Alchemy fee payment');
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
  // Exact token-fee approval is the only additional call that the paymaster can insert.
  if (actualCalls.length === request.calls.length + 1 && request.feeToken && data.paymaster) {
    const approvalIndex = actualCalls.findIndex(
      (call, index) => !request.calls[index] || !sameCall(call, request.calls[index])
    );
    const approval = actualCalls[approvalIndex];
    const decodedApproval = decodeFunctionData({ abi: erc20Abi, data: approval.data });
    if (
      !isAddressEqual(approval.to, request.feeToken) ||
      BigInt(approval.value) !== 0n ||
      decodedApproval.functionName !== 'approve' ||
      !isAddressEqual(decodedApproval.args[0], data.paymaster) ||
      decodedApproval.args[1] !== getAlchemyMaxFee(prepared)
    ) {
      throw new Error('Unexpected token-fee approval');
    }
    actualCalls.splice(approvalIndex, 1);
  }
  if (
    actualCalls.length !== request.calls.length ||
    actualCalls.some((call, index) => !sameCall(call, request.calls[index]))
  ) {
    throw new Error('Alchemy changed the batch calls');
  }
  const hash = getUserOperationHash({
    chainId: Number(BigInt(request.chainId)),
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
  return validateAlchemyPreparedCalls(quote.prepared, quote.request, quote.feeToken);
}
