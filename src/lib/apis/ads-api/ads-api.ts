import axios from 'axios';

import { BROWSER_IDENTIFIER_HEADER } from 'lib/browser';
import { APP_VERSION, EnvVars } from 'lib/env';
import { RewardsAddresses, HDAccountRewardsAddresses, NoAccountRewardsAddresses } from 'temple/types';

import { withAxiosDataExtract } from '../utils';

import { RpStatsResponse } from './types';

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
  provider: 'TakeAds' | 'Temple';
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
  { urlDomain, pageDomain, provider }: ReferralClickDetails
) {
  // "/takeads/" in endpoint name is left for backward compatibility
  // It can handle clicks from different providers
  await axiosClient.post('/takeads/referrals/click', {
    provider,
    accountPkh: tezosAddress,
    evmPkh: evmAddress,
    installId,
    urlDomain,
    pageDomain,
    appVersion: APP_VERSION
  });
}

/** Post a referral click identified by Jitsu userId (for TakeAds merchant offers) */
export async function postReferralClickByUserId(
  userId: string,
  { urlDomain, pageDomain, provider }: ReferralClickDetails
) {
  await axiosClient.post('/takeads/referrals/click', {
    provider,
    userId,
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

export interface TempleReferralLinkItem {
  targetUrl: string;
  referralLink: string;
}

export const fetchReferralsRules = withAxiosDataExtract(() =>
  axiosClient.get<ReferralsRulesResponse>('/referrals/rules')
);

export const fetchTempleReferralLinkItems = withAxiosDataExtract((browser: string) =>
  axiosClient.get<TempleReferralLinkItem[]>('/temple/referrals/links', { params: { browser } })
);

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

export async function postReactivationCheck(tezos: string[]): Promise<{ eligible: boolean }> {
  const { data } = await axiosClient.post<{ eligible: boolean }>('/reactivation/check', {
    tezos,
    appVersion: APP_VERSION
  });
  return data;
}

export const fetchEnableInternalHypelabAds = withAxiosDataExtract(() =>
  axiosClient.get<boolean>(`/ads-rules/${APP_VERSION}/enable-internal-hypelab-ads`)
);

export interface MerchantOffer {
  merchantId: number | null;
  name: string;
  imageUri: string | null;
  description: string;
  domain: string;
  cpcRate: number;
  currencyCode: string;
  trackingLink: string;
}

interface MerchantOfferResponse {
  offer: MerchantOffer | null;
}

export const fetchMerchantOffer = withAxiosDataExtract((domain: string) =>
  axiosClient.get<MerchantOfferResponse>('/takeads/merchant-offer', { params: { domain } })
);

interface ActivateMerchantOfferResponse {
  trackingLink: string;
  imageUrl: string | null;
}

export const activateMerchantOffer = withAxiosDataExtract((url: string, userId?: string) =>
  axiosClient.post<ActivateMerchantOfferResponse>('/takeads/merchant-offer/activate', { url, userId })
);
