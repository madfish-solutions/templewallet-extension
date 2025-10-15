import axios from 'axios';

import { BROWSER_IDENTIFIER_HEADER } from 'lib/browser';
import { APP_VERSION, EnvVars } from 'lib/env';
import { RewardsAddresses, HDAccountRewardsAddresses, NoAccountRewardsAddresses } from 'temple/types';

import { withAxiosDataExtract } from './utils';

const axiosClient = axios.create({
  baseURL: EnvVars.TEMPLE_ADS_API_URL,
  adapter: 'fetch',
  headers: {
    'x-temple-browser': BROWSER_IDENTIFIER_HEADER
  }
});

interface ImpressionDetails {
  /** For external */
  urlDomain?: string;
  /** For internal */
  pageName?: string;
}

export async function postAdImpression(
  { tezosAddress, evmAddress }: RewardsAddresses,
  provider: string,
  { urlDomain, pageName }: ImpressionDetails
) {
  await axiosClient.post('/impression', {
    accountPkh: tezosAddress,
    evmPkh: evmAddress,
    urlDomain,
    pageName,
    provider,
    appVersion: APP_VERSION
  });
}

export async function postAnonymousAdImpression(installId: string, urlDomain: string, provider: string) {
  await axiosClient.post('/impression', { installId, urlDomain, provider, appVersion: APP_VERSION });
}

interface ReferralClickDetails {
  /** Referral link domain */
  urlDomain: string;
  /** Page domain, where referral link was */
  pageDomain: string;
}

export async function postReferralClick(
  addresses: HDAccountRewardsAddresses,
  installId: undefined,
  details: ReferralClickDetails
): Promise<void>;
export async function postReferralClick(
  addresses: NoAccountRewardsAddresses,
  installId: string,
  details: ReferralClickDetails
): Promise<void>;
export async function postReferralClick(
  { tezosAddress, evmAddress }: RewardsAddresses,
  installId: string | undefined,
  { urlDomain, pageDomain }: ReferralClickDetails
) {
  await axiosClient.post('/takeads/referrals/click', {
    accountPkh: tezosAddress,
    evmPkh: evmAddress,
    installId,
    urlDomain,
    pageDomain,
    appVersion: APP_VERSION
  });
}

export async function postLinkAdsImpressions(
  { tezosAddress, evmAddress }: RewardsAddresses,
  installId: string,
  signature: string
) {
  await axiosClient.post('/link-impressions', {
    accountPkh: tezosAddress,
    evmPkh: evmAddress,
    installId,
    signature,
    appVersion: APP_VERSION
  });
}

interface ReferralTextIconRule {
  /** RegEx (string) to check page hostname against */
  hostRegExStr: string;
  aMatchSelector?: string;
  aChildSelector?: string;
  iconHeight?: number;
}

export interface ReferralsRulesResponse {
  domains: string[];
  textIconRules: ReferralTextIconRule[];
  redirectUrl?: string;
}

export const fetchReferralsRules = withAxiosDataExtract(() =>
  axiosClient.get<ReferralsRulesResponse>('/takeads/referrals/rules')
);

export const fetchReferralsAffiliateLinks = withAxiosDataExtract((links: string[]) =>
  axiosClient.post<TekeadsAffiliateResponse>('/takeads/referrals/affiliate-links', links).catch(err => {
    throw err;
  })
);

export interface RpStatsResponse {
  impressionsCount: number;
  referralsClicksCount: number;
}

interface RpForMonthResponse extends RpStatsResponse {
  firstActivityDate: string | null;
}

export const fetchRpForToday = withAxiosDataExtract((accountPkh: string) =>
  axiosClient.get<RpStatsResponse>('/rp/today', { params: { accountPkh, tzOffset: new Date().getTimezoneOffset() } })
);

export const fetchRpForMonth = withAxiosDataExtract((accountPkh: string, monthYearIndex: number) =>
  axiosClient.get<RpForMonthResponse>('/rp/month', {
    params: { accountPkh, monthYearIndex, tzOffset: new Date().getTimezoneOffset() }
  })
);

interface TekeadsAffiliateResponse {
  data: AffiliateLink[];
}

interface AffiliateLink {
  iri: string;
  trackingLink: string;
  imageUrl: string | null;
}
