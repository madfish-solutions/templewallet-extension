import axios from 'axios';

import { EnvVars } from 'lib/env';

const conversionApi = axios.create({
  baseURL: EnvVars.CONVERSION_API_URL,
  withCredentials: true
});

interface ConversionAccount {
  id: string;
  tezosAddress: string | null;
  evmAddress: string | null;
  referralLinkId: string | null;
  createdAt: string;
  extras: unknown;
  referralId: string | null;
  referralTezosAddress: string | null;
  referralEvmAddress: string | null;
  referralExtras: unknown;
}

export function fetchConversionAccount() {
  return conversionApi.get<ConversionAccount>('/v1/me').then(response => response.data);
}

export function fetchConversionInformation() {
  return conversionApi.get<{ linkId: string; name: string }>('/v1/verify').then(response => response.data);
}

export function registerWallet(tezosAddress: string, evmAddress: string) {
  return conversionApi
    .post<{ message: string }>('/v1/register-wallet', { tezosAddress, evmAddress })
    .then(response => response.data);
}

export function getRefLink() {
  return conversionApi
    .get<{ id: string }>('/v1/ref-link')
    .then(({ data }) => `${EnvVars.CONVERSION_API_URL}/share/${data.id}`);
}

export function getReferralsCount(signal?: AbortSignal) {
  return conversionApi.get<{ count: string }>(`/v1/referrals-count`, { signal }).then(({ data }) => data.count);
}
