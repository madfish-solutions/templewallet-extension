import { formatAmountToTargetSize } from './index';

describe('formatAmountToTargetSize', () => {
  it('should work', () => {
    expect(formatAmountToTargetSize('100000.1234567890')).toEqual('100000');

    expect(formatAmountToTargetSize('100000.9876543210')).toEqual('100001');

    //

    expect(formatAmountToTargetSize('1000.1234567890')).toEqual('1000.12');

    expect(formatAmountToTargetSize('1000.9876543210')).toEqual('1000.99');

    //

    expect(formatAmountToTargetSize('10.1234567890')).toEqual('10.1235');

    expect(formatAmountToTargetSize('10.9876543210')).toEqual('10.9877');

    //

    expect(formatAmountToTargetSize('10.11195')).toEqual('10.1120');

    //

    expect(formatAmountToTargetSize('9876543210.1234567890')).toEqual('9876543210');

    expect(formatAmountToTargetSize('9876543210.9876543210')).toEqual('9876543211');
  });
});
