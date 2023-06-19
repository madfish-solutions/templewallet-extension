import axios from 'axios';

import { EnvVars } from 'lib/env';

export const route3Api = axios.create({
  baseURL: 'https://temple.3route.io/v3',
  headers: {
    Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
  }
});
