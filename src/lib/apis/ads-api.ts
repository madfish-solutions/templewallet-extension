import axios from 'axios';

import { APP_VERSION, EnvVars } from 'lib/env';

const axiosClient = axios.create({
  baseURL: EnvVars.TEMPLE_ADS_API_URL,
  adapter: 'fetch'
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

interface ReferralClickDetails {
  /** Referral link domain */
  urlDomain: string;
  /** Page domain, where referral link was */
  pageDomain: string;
}

export async function postReferralClick(
  accountPkh: string,
  installId: undefined,
  details: ReferralClickDetails
): Promise<void>;
export async function postReferralClick(
  accountPkh: undefined,
  installId: string,
  details: ReferralClickDetails
): Promise<void>;
export async function postReferralClick(
  accountPkh: string | undefined,
  installId: string | undefined,
  { urlDomain, pageDomain }: ReferralClickDetails
) {
  await axiosClient.post('/takeads/referrals/click', {
    accountPkh,
    installId,
    urlDomain,
    pageDomain,
    appVersion: APP_VERSION
  });
}

export async function postLinkAdsImpressions(accountPkh: string, installId: string, signature: string) {
  await axiosClient.post('/link-impressions', { accountPkh, installId, signature, appVersion: APP_VERSION });
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

export async function fetchReferralsRules() {
  const res = await axiosClient.get<ReferralsRulesResponse>('/takeads/referrals/rules');

  return res.data;
}

export async function fetchReferralsAffiliateLinks(links: string[]) {
  const res = await axiosClient
    .post<TekeadsAffiliateResponse>('/takeads/referrals/affiliate-links', links)
    .catch(err => {
      throw err;
    });

  return res.data;
}

interface TekeadsAffiliateResponse {
  data: AffiliateLink[];
}
interface AffiliateLink {
  iri: string;
  trackingLink: string;
  imageUrl: string | null;
}
