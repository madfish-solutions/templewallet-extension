import { templeWalletApi } from 'lib/templewallet-api/endpoints/templewallet.api';

import type { CustomDAppsInfo } from './types';

export const getDApps = () => templeWalletApi.get<CustomDAppsInfo>('/dapps').then(res => res.data);
