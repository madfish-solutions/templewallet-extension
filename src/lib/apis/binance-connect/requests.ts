import axios from 'axios';

import { API_URL, MERCHANT_CODE } from './config';
import { buildGetSignature, buildPostSignature } from './signing';

const api = axios.create({
  baseURL: API_URL
});

interface SuccessResponse<D> {
  success: true;
  data: D;
  code: '000000000';
  message: null;
  messageDetail: null;
}

interface ErrorResponse {
  success: false;
  data: null;
  code: string;
  message: string;
  messageDetail: string | null;
  errorMessage: string | null;
}

type ResponseData<D> = SuccessResponse<D> | ErrorResponse;

export class BinanceConnectError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

export const makeGetRequest = async <D>(endpoint: string) => {
  const timestamp = Date.now();

  const signature = await buildGetSignature(timestamp);

  const response = await api.get<ResponseData<D>>(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      merchantCode: MERCHANT_CODE,
      timestamp: String(timestamp),
      'x-api-signature': signature
    }
  });

  if (!response.data.success) throw new BinanceConnectError(response.data.code, response.data.message);

  return response.data.data;
};

export const makePostRequest = async <D>(endpoint: string, payload: object) => {
  const timestamp = Date.now();

  const signature = await buildPostSignature(JSON.stringify(payload), timestamp);

  const response = await api.post<ResponseData<D>>(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      merchantCode: MERCHANT_CODE,
      timestamp: String(timestamp),
      'x-api-signature': signature
    }
  });

  if (!response.data.success) throw new BinanceConnectError(response.data.code, response.data.message);

  return response.data.data;
};
