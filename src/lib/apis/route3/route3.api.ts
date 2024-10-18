import axios from 'axios';

import { EnvVars } from 'lib/env';

export const ROUTE3_BASE_URL = 'https://temple.3route.io/v4';

export const route3Api = axios.create({
  baseURL: ROUTE3_BASE_URL,
  headers: {
    Authorization: EnvVars.TEMPLE_WALLET_ROUTE3_AUTH_TOKEN
  }
});
