import axios from 'axios';

import { EnvVars } from 'lib/env';

export const templeWalletApi = axios.create({ baseURL: EnvVars.TEMPLE_WALLET_API_URL + '/api' });
