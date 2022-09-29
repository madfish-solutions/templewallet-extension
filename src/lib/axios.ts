import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

export function createAPI(config?: AxiosRequestConfig) {
  return axios.create({
    ...config,
    adapter: fetchAdapter
  });
}
