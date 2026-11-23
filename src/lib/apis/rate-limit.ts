import { HttpResponseError } from '@taquito/http-utils';
import axios from 'axios';
import { BaseError, HttpRequestError } from 'viem';

import { AlchemyRpcError } from './temple/endpoints/evm/alchemy-wallet';

export const isRateLimitError = (error: unknown) =>
  (error instanceof AlchemyRpcError && error.code === 429) ||
  (axios.isAxiosError(error) && error.response?.status === 429) ||
  (error instanceof HttpResponseError && Number(error.status) === 429) ||
  (error instanceof BaseError &&
    error.walk(cause => cause instanceof HttpRequestError && cause.status === 429) !== null);
