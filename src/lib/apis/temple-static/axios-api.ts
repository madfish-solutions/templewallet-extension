import axios from 'axios';

import { EnvVars } from 'lib/env';

export const axiosApi = axios.create({ baseURL: EnvVars.TEMPLE_WALLET_STATIC_API_URL + '/api' });
