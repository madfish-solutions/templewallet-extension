import { from, map } from 'rxjs';

import { ExolixNetworksMap } from 'app/store/crypto-exchange/state';

import { templeWalletApi } from './templewallet.api';

export const getExolixNetworksMap$ = () =>
  from(templeWalletApi.get<ExolixNetworksMap>('/exolix-networks-map')).pipe(map(response => response.data));
