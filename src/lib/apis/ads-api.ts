import axiosFetchAdapter from '@vespaiach/axios-fetch-adapter';
import axios from 'axios';

import { APP_VERSION, EnvVars } from 'lib/env';

const axiosClient = axios.create({
  baseURL: EnvVars.TEMPLE_ADS_API_URL,
  adapter: axiosFetchAdapter
});

interface ImpressionDetails {
  /** For external */
  urlDomain?: string;
  /** For internal */
  pageName?: string;
}

export async function postAdImpression(
  accountPkh: string,
  provider: string,
  { urlDomain, pageName }: ImpressionDetails
) {
  await axiosClient.post('/impression', {
    accountPkh,
    urlDomain,
    pageName,
    provider,
    appVersion: APP_VERSION
  });
}

export async function postAnonymousAdImpression(installId: string, urlDomain: string, provider: string) {
  await axiosClient.post('/impression', { installId, urlDomain, provider, appVersion: APP_VERSION });
}

export async function postLinkAdsImpressions(accountPkh: string, installId: string, signature: string) {
  await axiosClient.post('/link-impressions', { accountPkh, installId, signature, appVersion: APP_VERSION });
}

export async function fetchReferralsSupportedDomains() {
  const res = await axiosClient.get<string[]>('/takeads/referrals/supported-domains');

  return res.data;
}
