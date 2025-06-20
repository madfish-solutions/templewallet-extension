import axios from 'axios';

import { EnvVars } from 'lib/env';

const conversionApi = axios.create({
  baseURL: EnvVars.CONVERSION_API_URL,
  withCredentials: true
});

export function fetchConversionInformation() {
  return conversionApi
    .get<{ linkId: string; name: string; userId: string }>('/v1/verify')
    .then(response => response.data);
}

export function registerWallet(tezosAddress: string, evmAddress: string, userId?: string | null) {
  return conversionApi
    .post<{ message: string; userId: string }>('/v1/register-wallet', {
      tezosAddress,
      evmAddress,
      id: userId
    })
    .then(response => response.data);
}

export function getRefLink(userId: string) {
  return conversionApi
    .get<{ id: string }>('/v1/ref-link', { params: { userId } })
    .then(({ data }) => `${EnvVars.CONVERSION_API_URL}/share/${data.id}`);
}

export function getReferrersCount(userId: string) {
  return conversionApi.get<{ count: number }>(`/v1/referrers-count/${userId}`).then(({ data }) => data.count);
}
