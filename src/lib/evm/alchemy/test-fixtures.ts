import type { LiFiStep } from '@lifi/sdk';
import { encodeFunctionData, parseAbi } from 'viem';

import type { AlchemyBatchQuote, AlchemyPreparedOperation } from './types';
import { addAlchemyGasParamsOverride, getAlchemyOperationHash } from './validation';

export const account = '0x1111111111111111111111111111111111111111';
export const target = '0x3333333333333333333333333333333333333333';
const token = '0x2222222222222222222222222222222222222222';

export function makeStep(destination = 1): LiFiStep {
  return {
    includedSteps: [],
    id: `step-${destination}`,
    type: 'lifi',
    tool: 'test',
    toolDetails: { key: 'test', name: 'test', logoURI: '' },
    action: {
      fromChainId: 1,
      toChainId: destination,
      fromAmount: '100',
      fromAddress: account,
      toAddress: account,
      fromToken: { address: token, chainId: 1, decimals: 6, symbol: 'T', name: 'Token', priceUSD: '1' },
      toToken: { address: token, chainId: destination, decimals: 6, symbol: 'T', name: 'Token', priceUSD: '1' },
      slippage: 0.01
    },
    estimate: {
      tool: 'test',
      approvalAddress: target,
      fromAmount: '100',
      toAmount: '99',
      toAmountMin: '98',
      executionDuration: 10
    },
    transactionRequest: { chainId: 1, from: account, to: target, data: '0x1234', value: '0x5', gasLimit: '1000' }
  };
}

export function makeQuote(): AlchemyBatchQuote {
  const request = addAlchemyGasParamsOverride(
    { from: account, chainId: '0x1', calls: [{ to: target, value: '0x5', data: '0x1234' }] },
    'mid'
  );
  const operation: AlchemyPreparedOperation = {
    type: 'user-operation-v070',
    chainId: '0x1',
    data: {
      sender: account,
      nonce: '0x10',
      callData: encodeFunctionData({
        abi: parseAbi(['function executeBatch((address target, uint256 value, bytes data)[] calls)']),
        functionName: 'executeBatch',
        args: [[{ target, value: 5n, data: '0x1234' }]]
      }),
      callGasLimit: '0xa',
      verificationGasLimit: '0xa',
      preVerificationGas: '0xa',
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1'
    },
    signatureRequest: { type: 'personal_sign', data: { raw: '0x' } }
  };
  operation.signatureRequest.data.raw = getAlchemyOperationHash(operation);
  return { request, prepared: operation, feeOption: 'mid', expiresAt: Date.now() + 60_000 };
}
