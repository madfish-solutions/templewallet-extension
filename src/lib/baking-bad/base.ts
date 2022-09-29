import { createAPI } from 'lib/axios';

export const BASE_URL = 'https://api.baking-bad.org/v2';

export const api = createAPI({ baseURL: BASE_URL });
