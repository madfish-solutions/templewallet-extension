import {
  addAlchemyGasParamsOverride,
  ALCHEMY_DELEGATION,
  getAlchemyMaxCost,
  isEip7702DelegationCode
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
