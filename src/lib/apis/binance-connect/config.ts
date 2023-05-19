import { IS_STAGE_ENV } from 'lib/env';

export const MERCHANT_CODE = IS_STAGE_ENV ? 'madfish_test' : 'madfish';

const host = IS_STAGE_ENV ? 'https://sandbox.bifinitypay.com' : 'https://cb.bifinitypay.com';

export const API_URL = `${host}/gateway-api/v1/public/open-api/connect`;
