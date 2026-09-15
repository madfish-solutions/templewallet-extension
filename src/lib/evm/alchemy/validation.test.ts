import { addAlchemyGasParamsOverride, ALCHEMY_DELEGATION, isEip7702DelegationCode } from './validation';

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
