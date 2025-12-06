import { setApiUrl } from '@temple-wallet/everstake-wallet-sdk';
import axios from 'axios';

import { EnvVars } from 'lib/env';

setApiUrl(`${EnvVars.TEMPLE_WALLET_API_URL}/api/evm`);

export const templeWalletApi = axios.create({
  baseURL: new URL('/api', EnvVars.TEMPLE_WALLET_API_URL).href,
  adapter: 'fetch'
});
