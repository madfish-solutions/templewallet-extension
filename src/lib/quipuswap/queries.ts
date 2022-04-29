import axios, { AxiosResponse } from 'axios';

import { QuipuswapToken } from './types';

export const getQuipuswapWhitelist = () =>
  axios
    .get<{}, AxiosResponse<QuipuswapToken[]>>(
      'https://cloudflare-ipfs.com/ipfs/QmWQPjhuVwazjX9XrnsvAW9jsK3zLXThN8ngCihJEH8GUS'
    )
    .then(res => res.data);
