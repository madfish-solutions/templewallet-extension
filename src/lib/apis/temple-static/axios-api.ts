import axios from 'axios';

import { EnvVars } from 'lib/env';

export const axiosApi = axios.create({ baseURL: new URL('/api', EnvVars.TEMPLE_WALLET_STATIC_API_URL).href });
