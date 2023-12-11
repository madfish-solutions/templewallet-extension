import { templeWalletApi } from '../endpoints/templewallet.api';

import type { CustomDAppsInfo } from './types';

export const getDApps = () => templeWalletApi.get<CustomDAppsInfo>('/dapps').then(res => res.data);
