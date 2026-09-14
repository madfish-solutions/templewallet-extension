import { encodeFunctionData, erc20Abi, hashMessage, numberToHex } from 'viem';
import { entryPoint07Address, getUserOperationHash } from 'viem/account-abstraction';

import {
  AlchemyCall,
  AlchemyFeeToken,
  AlchemyBatchRequest,
  AlchemyPreparedCalls,
  AlchemyPreparedOperation
} from './types';
import {
  ALCHEMY_DELEGATIONS,
  alchemyExecutionAbi,
  getAlchemyMaxFee,
  validateAlchemyPreparedCalls,
  validateAlchemyQuote
} from './validation';

const account = '0x1111111111111111111111111111111111111111';
const target = '0x2222222222222222222222222222222222222222';
const request: AlchemyBatchRequest = {
  from: account,
  chainId: '0x1',
  calls: [{ to: target, data: '0x1234', value: '0x5' }]
};

function prepare(feeToken?: AlchemyFeeToken): AlchemyPreparedOperation {
  const operation = {
    sender: account,
    paymaster: feeToken?.paymaster,
    nonce: 0n,
    callData: encodeFunctionData({
      abi: alchemyExecutionAbi,
      functionName: 'executeBatch',
      args: [
        [
          ...(feeToken
            ? [
                {
                  target: feeToken.address,
                  value: 0n,
                  data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [feeToken.paymaster, 100n] })
                }
              ]
            : []),
          { target, value: 5n, data: '0x1234' }
        ]
      ]
    }),
    callGasLimit: 30_000n,
    verificationGasLimit: 20_000n,
    preVerificationGas: 10_000n,
    maxFeePerGas: 10n,
    maxPriorityFeePerGas: 1n,
    signature: '0x'
  } as const;
  const hash = getUserOperationHash({
    chainId: 1,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: '0.7',
    userOperation: operation
  });
  return {
    type: 'user-operation-v070',
    chainId: '0x1',
    data: {
      ...operation,
      nonce: numberToHex(operation.nonce),
      callGasLimit: numberToHex(operation.callGasLimit),
      verificationGasLimit: numberToHex(operation.verificationGasLimit),
      preVerificationGas: numberToHex(operation.preVerificationGas),
      maxFeePerGas: numberToHex(operation.maxFeePerGas),
      maxPriorityFeePerGas: numberToHex(operation.maxPriorityFeePerGas)
    },
    feePayment: feeToken ? { tokenAddress: feeToken.address, maxAmount: '0x64' } : undefined,
    signatureRequest: { type: 'personal_sign', data: { raw: hash }, rawPayload: hashMessage({ raw: hash }) }
  };
}

describe('Alchemy signature boundary', () => {
  it('validates the exact batch and derives the maximum native fee', () => {
    const prepared = prepare();
    expect(validateAlchemyPreparedCalls(prepared, request)).toBe(prepared.signatureRequest.data.raw);
    expect(getAlchemyMaxFee(prepared)).toBe(600_000n);
  });

  it('rejects a changed recipient, value, calldata, sender, or chain', () => {
    for (const calls of [
      [{ ...request.calls[0], to: account }],
      [{ ...request.calls[0], value: '0x6' as const }],
      [{ ...request.calls[0], data: '0x9999' as const }],
      [...request.calls, ...request.calls]
    ] satisfies AlchemyCall[][])
      expect(() => validateAlchemyPreparedCalls(prepare(), { ...request, calls })).toThrow();
    expect(() => validateAlchemyPreparedCalls(prepare(), { ...request, from: target })).toThrow();
    expect(() => validateAlchemyPreparedCalls(prepare(), { ...request, chainId: '0x89' })).toThrow();
  });

  it('rejects a substituted signature digest and gas fields', () => {
    const prepared = prepare();
    prepared.signatureRequest.data.raw = `0x${'00'.repeat(32)}`;
    expect(() => validateAlchemyPreparedCalls(prepared, request)).toThrow('signature');
    const changed = prepare();
    changed.data.maxFeePerGas = '0xffff';
    expect(() => validateAlchemyPreparedCalls(changed, request)).toThrow('signature');
  });

  it('allows only a chain-bound authorization to a trusted delegation', () => {
    const prepared: AlchemyPreparedCalls = {
      type: 'array',
      data: [
        { type: 'authorization', chainId: '0x1', data: { address: ALCHEMY_DELEGATIONS[0], nonce: '0x0' } },
        prepare()
      ]
    };
    expect(validateAlchemyPreparedCalls(prepared, request)).toBe(prepared.data[1].signatureRequest.data.raw);
    prepared.data[0].chainId = '0x0';
    expect(() => validateAlchemyPreparedCalls(prepared, request)).toThrow('delegation');
    prepared.data[0].chainId = '0x1';
    prepared.data[0].data.address = target;
    expect(() => validateAlchemyPreparedCalls(prepared, request)).toThrow('delegation');
  });

  it('rejects an unexpected token payment and an expired quote', () => {
    const prepared = prepare();
    prepared.feePayment = { maxAmount: '0x100', tokenAddress: target };
    expect(() => validateAlchemyPreparedCalls(prepared, request)).toThrow('fee payment');
    expect(() => validateAlchemyQuote({ prepared: prepare(), request, expiresAt: Date.now() - 1 })).toThrow('expired');
  });
  it('binds an exact token-fee approval to the configured token and paymaster', () => {
    const token: AlchemyFeeToken = {
      address: '0x3333333333333333333333333333333333333333',
      paymaster: '0x4444444444444444444444444444444444444444',
      symbol: 'USDC',
      decimals: 6
    };
    const prepared = prepare(token);
    const tokenRequest = { ...request, feeToken: token.address };
    expect(validateAlchemyPreparedCalls(prepared, tokenRequest, token)).toBe(prepared.signatureRequest.data.raw);
    expect(getAlchemyMaxFee(prepared)).toBe(100n);
    expect(() => validateAlchemyPreparedCalls(prepared, tokenRequest, { ...token, paymaster: account })).toThrow(
      'fee token'
    );
    prepared.feePayment!.maxAmount = '0x63';
    expect(() => validateAlchemyPreparedCalls(prepared, tokenRequest, token)).toThrow('approval');
  });

  it('does not display a native quote below the signed gas limit', () => {
    const prepared = prepare();
    prepared.feePayment = { maxAmount: '0x1' };
    expect(getAlchemyMaxFee(prepared)).toBe(600_000n);
  });
});
