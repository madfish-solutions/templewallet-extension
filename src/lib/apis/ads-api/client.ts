import axios from 'axios';

import { BROWSER_IDENTIFIER_HEADER } from 'lib/browser';
import { EnvVars } from 'lib/env';

export const axiosClient = axios.create({
  baseURL: EnvVars.TEMPLE_ADS_API_URL,
  adapter: 'fetch',
  headers: {
    'x-temple-browser': BROWSER_IDENTIFIER_HEADER
  }
});
