import axiosFetchAdapter from '@vespaiach/axios-fetch-adapter';
import axios from 'axios';

import { EnvVars } from 'lib/env';

import PackageJSON from '../../../package.json';

const axiosClient = axios.create({
  baseURL: EnvVars.TEMPLE_ADS_API_URL,
  adapter: axiosFetchAdapter
});

const appVersion = PackageJSON.version;

interface ImpressionDetails {
  /** For external */
  urlDomain?: string;
  /** For internal */
  pageName?: string;
  /** For internal */
  variant?: string;
}

export async function postAdImpression(
  accountPkh: string,
  provider: string,
  { urlDomain, pageName }: ImpressionDetails
) {
  await axiosClient.post('/impression', { accountPkh, urlDomain, pageName, provider, appVersion });
}

export async function postAnonymousAdImpression(installId: string, urlDomain: string, provider: string) {
  await axiosClient.post('/impression', { installId, urlDomain, provider, appVersion });
}

export async function postLinkAdsImpressions(accountPkh: string, installId: string, signature: string) {
  await axiosClient.post('/link-impressions', { accountPkh, installId, signature, appVersion });
}
