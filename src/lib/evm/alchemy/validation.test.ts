import { encodeFunctionData, hashMessage, parseAbi } from 'viem';
import { getUserOperationHash, entryPoint07Address } from 'viem/account-abstraction';

import { account, target, makeQuote } from './test-fixtures';
import {
  addAlchemyGasParamsOverride,
  ALCHEMY_DELEGATION,
  getAlchemyMaxCost,
  isEip7702DelegationCode,
  getAlchemyOperation,
  validateAlchemyPreparedCalls,
  validateAlchemyQuote
} from './validation';

it('recognizes an EIP-7702 delegation designation', () => {
  expect(isEip7702DelegationCode('0xef01001111111111111111111111111111111111111111')).toBe(true);
});

it('rejects ordinary contract code', () => {
  expect(isEip7702DelegationCode('0x6001600055')).toBe(false);
});

it('requests the supported Alchemy delegation version', () => {
  const request = addAlchemyGasParamsOverride(
    {
      from: '0x1111111111111111111111111111111111111111',
      chainId: '0x1',
      calls: [{ to: ALCHEMY_DELEGATION, data: '0x', value: '0x0' }]
    },
    'mid'
  );

  expect(request.capabilities?.eip7702Auth).toEqual({
    delegation: 'ModularAccountV2',
    version: 'v1.1.0'
  });
});

it.each([
  ['slow', 0.7],
  ['mid', 0.85],
  ['fast', 1]
] as const)('sets the %s fee multiplier to %s', (feeOption, multiplier) => {
  const request = addAlchemyGasParamsOverride(
    {
      from: '0x1111111111111111111111111111111111111111',
      chainId: '0x1',
      calls: [{ to: ALCHEMY_DELEGATION, data: '0x', value: '0x0' }]
    },
    feeOption
  );

  expect(request.capabilities?.gasParamsOverride).toEqual({
    maxFeePerGas: { multiplier },
    maxPriorityFeePerGas: { multiplier }
  });
});

it('includes every native call value in the maximum batch cost', () => {
  expect(
    getAlchemyMaxCost({
      request: {
        from: '0x1111111111111111111111111111111111111111',
        chainId: '0x1',
        calls: [
          { to: ALCHEMY_DELEGATION, data: '0x', value: '0x0' },
          { to: ALCHEMY_DELEGATION, data: '0x', value: '0x64' }
        ]
      },
      prepared: {
        type: 'user-operation-v070',
        chainId: '0x1',
        data: {
          sender: '0x1111111111111111111111111111111111111111',
          nonce: '0x1',
          callData: '0x',
          callGasLimit: '0xa',
          verificationGasLimit: '0xa',
          preVerificationGas: '0xa',
          maxFeePerGas: '0x2',
          maxPriorityFeePerGas: '0x1'
        },
        signatureRequest: { type: 'personal_sign', data: { raw: '0x1' } }
      },
      expiresAt: Date.now() + 60_000,
      feeOption: 'mid'
    })
  ).toBe(160n);
});

it('validates the prepared calls against an independently computed operation hash', () => {
  const quote = makeQuote();
  const operation = getAlchemyOperation(quote.prepared);
  const expected = getUserOperationHash({
    chainId: 1,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: '0.7',
    userOperation: {
      sender: account,
      nonce: 16n,
      callData: operation.data.callData,
      callGasLimit: 10n,
      verificationGasLimit: 10n,
      preVerificationGas: 10n,
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
      signature: '0x'
    }
  });
  expect(validateAlchemyPreparedCalls(quote.prepared, quote.request)).toBe(expected);
  expect(validateAlchemyQuote(quote)).toBe(expected);
});
it.each(['target', 'value', 'data', 'count'] as const)('rejects changed batch call %s', field => {
  const quote = makeQuote();
  const calls: { target: `0x${string}`; value: bigint; data: `0x${string}` }[] = [
    {
      target: field === 'target' ? account : target,
      value: field === 'value' ? 6n : 5n,
      data: field === 'data' ? ('0xabcd' as const) : ('0x1234' as const)
    }
  ];
  if (field === 'count') calls.push(calls[0]);
  getAlchemyOperation(quote.prepared).data.callData = encodeFunctionData({
    abi: parseAbi(['function executeBatch((address target, uint256 value, bytes data)[] calls)']),
    functionName: 'executeBatch',
    args: [calls]
  });
  expect(() => validateAlchemyPreparedCalls(quote.prepared, quote.request)).toThrow('changed the batch calls');
});
it('rejects a changed account', () => {
  const quote = makeQuote();
  getAlchemyOperation(quote.prepared).data.sender = target;
  expect(() => validateAlchemyPreparedCalls(quote.prepared, quote.request)).toThrow('changed the account');
});
it('rejects a changed chain', () => {
  const quote = makeQuote();
  getAlchemyOperation(quote.prepared).chainId = '0xa';
  expect(() => validateAlchemyPreparedCalls(quote.prepared, quote.request)).toThrow('chain');
});
it('rejects an arbitrary signature payload', () => {
  const quote = makeQuote();
  getAlchemyOperation(quote.prepared).signatureRequest.data.raw = `0x${'ff'.repeat(32)}`;
  expect(() => validateAlchemyPreparedCalls(quote.prepared, quote.request)).toThrow('signature');
});
it('accepts only the personal-sign digest for rawPayload', () => {
  const quote = makeQuote();
  const operation = getAlchemyOperation(quote.prepared);
  operation.signatureRequest.rawPayload = hashMessage({ raw: operation.signatureRequest.data.raw });
  expect(() => validateAlchemyPreparedCalls(quote.prepared, quote.request)).not.toThrow();
  operation.signatureRequest.rawPayload = operation.signatureRequest.data.raw;
  expect(() => validateAlchemyPreparedCalls(quote.prepared, quote.request)).toThrow('signature');
});
it.each([target, ALCHEMY_DELEGATION] as const)('checks the delegation allowlist for %s', address => {
  const quote = makeQuote();
  quote.prepared = {
    type: 'array',
    data: [
      { type: 'authorization', chainId: '0x1', data: { address, nonce: '0x0' } },
      getAlchemyOperation(quote.prepared)
    ]
  };
  if (address === ALCHEMY_DELEGATION) expect(() => validateAlchemyQuote(quote)).not.toThrow();
  else expect(() => validateAlchemyQuote(quote)).toThrow('Untrusted');
});
it('rejects authorization on a different chain', () => {
  const quote = makeQuote();
  quote.prepared = {
    type: 'array',
    data: [
      { type: 'authorization', chainId: '0xa', data: { address: ALCHEMY_DELEGATION, nonce: '0x0' } },
      getAlchemyOperation(quote.prepared)
    ]
  };
  expect(() => validateAlchemyQuote(quote)).toThrow('Untrusted');
});
it.each([-1, 60_001])('rejects a quote with expiry offset %i', offset => {
  jest.spyOn(Date, 'now').mockReturnValue(100_000);
  const quote = makeQuote();
  quote.expiresAt = Date.now() + offset;
  expect(() => validateAlchemyQuote(quote)).toThrow('expired');
  jest.restoreAllMocks();
});
it('rejects a fee multiplier that differs from the selected option', () => {
  const quote = makeQuote();
  quote.request.capabilities!.gasParamsOverride.maxFeePerGas.multiplier = 1;
  expect(() => validateAlchemyQuote(quote)).toThrow('capabilities');
});
it.each([
  [0n, 65n],
  [20n, 45n],
  [60n, 5n],
  [100n, 5n]
])('uses a deposit of %s for gas only', (deposit, required) => {
  expect(getAlchemyMaxCost(makeQuote(), deposit)).toBe(required);
});
it('does not charge a native gas contribution for a sponsored operation', () => {
  const quote = makeQuote();
  getAlchemyOperation(quote.prepared).data.paymaster = target;
  expect(getAlchemyMaxCost(quote)).toBe(5n);
});
