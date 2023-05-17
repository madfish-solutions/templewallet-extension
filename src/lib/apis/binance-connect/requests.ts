import axios from 'axios';

import { API_URL, MERCHANT_CODE } from './config';
import { buildGetSignature, buildPostSignature } from './signing';

const api = axios.create({
  baseURL: API_URL
});

export const makeGetRequest = async <D>(endpoint: string) => {
  const timestamp = Date.now();

  const signature = await buildGetSignature(timestamp);

  return await api.get<{ data: D }>(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      merchantCode: MERCHANT_CODE,
      timestamp: String(timestamp),
      'x-api-signature': signature
    }
  });
};

export const makePostRequest = async <D>(endpoint: string, payload: object) => {
  const timestamp = Date.now();

  const signature = await buildPostSignature(JSON.stringify(payload), timestamp);

  return await api.post<{ data: D }>(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      merchantCode: MERCHANT_CODE,
      timestamp: String(timestamp),
      'x-api-signature': signature
    }
  });
};
