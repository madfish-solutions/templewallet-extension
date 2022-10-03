import axios from 'axios';

import type { CustomDAppsInfo } from './types';

export const getDApps = () =>
  axios.get<CustomDAppsInfo>('https://api.templewallet.com/api/dapps').then(res => res.data);
