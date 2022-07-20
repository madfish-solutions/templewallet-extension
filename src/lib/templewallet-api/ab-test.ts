import { templewalletQuery } from './templewallet-query';

export enum ABTestGroup {
  A = 'A',
  B = 'B',
  Unknown = 'Unknown'
}

export const getABGroup = templewalletQuery<{}, { ab: ABTestGroup.A | ABTestGroup.B }>('GET', '/abtest');
