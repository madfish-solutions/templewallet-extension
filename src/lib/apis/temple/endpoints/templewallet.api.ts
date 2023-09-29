import axios from 'axios';

//import { EnvVars } from 'lib/env';

export const templeWalletApi = axios.create({ baseURL: new URL('/api', 'http://localhost:3000').href });
