import axiosFetchAdapter from '@vespaiach/axios-fetch-adapter';
import axios from 'axios';

import { EnvVars } from 'lib/env';

const axiosClient = axios.create({
  baseURL: EnvVars.TEMPLE_ADS_API_URL,
  adapter: axiosFetchAdapter
});

export async function postAdImpression(accountPkh: string, url: string, provider: string) {
  await axiosClient.post('/impression', { accountPkh, url, provider });
}

export async function postAnonymousAdImpression(installId: string, url: string, provider: string) {
  await axiosClient.post('/impression', { installId, url, provider });
}

export async function postLinkAdsImpressions(accountPkh: string, installId: string, signature: string) {
  await axiosClient.post('/link-impressions', { accountPkh, installId, signature });
}
