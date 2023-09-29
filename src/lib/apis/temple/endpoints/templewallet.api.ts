import axios from 'axios';

import { EnvVars } from 'lib/env';

export const templeWalletApi = axios.create({ baseURL: new URL('/api', EnvVars.TEMPLE_WALLET_API_URL).href });
