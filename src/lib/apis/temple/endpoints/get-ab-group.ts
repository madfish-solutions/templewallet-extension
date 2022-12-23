import { templeWalletApi } from './templewallet.api';

export enum ABTestGroup {
  A = 'A',
  B = 'B',
  Unknown = 'Unknown'
}

interface GetABGroupResponse {
  ab: ABTestGroup.A | ABTestGroup.B;
}

export const getABGroup = () =>
  templeWalletApi
    .get<GetABGroupResponse>('/abtest')
    .then(response => response.data.ab)
    .catch(() => ABTestGroup.Unknown);
