import axios, { AxiosResponse } from 'axios';

import { QuipuswapToken } from './types';

export const getQuipuswapWhitelist = () => axios.get<{}, AxiosResponse<QuipuswapToken[]>>(
  "https://dev.quipuswap.com/whitelist.json"
).then(res => res.data);
