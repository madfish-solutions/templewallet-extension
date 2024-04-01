import { isValidTezosAddress, isTezosContractAddress } from './index';

let address: string;

describe('Tezos Helpers', () => {
  it('isValidTezosAddress', async () => {
    address = 'asdasdasd';
    expect(isValidTezosAddress(address)).toBeFalsy();

    address = 'tz1asdasd';
    expect(isValidTezosAddress(address)).toBeFalsy();

    address = 'tz1ZfrERcALBwmAqwonRXYVQBDT9BjNjBHJu';
    expect(isValidTezosAddress(address)).toBeTruthy();

    address = 'tz2Ch1abG7FNiibmV26Uzgdsnfni9XGrk5wD';
    expect(isValidTezosAddress(address)).toBeTruthy();

    address = 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At';
    expect(isValidTezosAddress(address)).toBeTruthy();

    address = 'KT1EyH6KR9STvgiet4ahrtBf7WCnmJovvJa1';
    expect(isValidTezosAddress(address)).toBeTruthy();
  });

  it('isTezosContractAddress', async () => {
    address = 'tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At';
    expect(isTezosContractAddress(address)).toBeFalsy();

    address = 'KT1EyH6KR9STvgiet4ahrtBf7WCnmJovvJa1';
    expect(isTezosContractAddress(address)).toBeTruthy();
  });
});
