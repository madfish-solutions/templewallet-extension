import { validateTezosContractAddress } from './helpers';

let address: string;

describe('Front Tezos Helpers', () => {
  it('validateTezosContractAddress', async () => {
    address = 'asdasd';
    expect(validateTezosContractAddress(address)).toBe('Translated<invalidAddress>');

    address = 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At';
    expect(validateTezosContractAddress(address)).toBe('Translated<onlyKTContractAddressAllowed>');

    address = 'KT1EyH6KR9STvgiet4ahrtBf7WCnmJovvJa1';
    expect(validateTezosContractAddress(address)).toBeTruthy();
  });
});
