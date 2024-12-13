import { AxiosResponse } from 'axios';

export const withAxiosDataExtract =
  <A extends unknown[], T>(fn: (...args: A) => Promise<AxiosResponse<T>>) =>
  async (...args: A) => {
    const response = await fn(...args);

    return response.data;
  };
