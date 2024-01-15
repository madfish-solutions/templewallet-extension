import { AxiosResponse } from 'axios';

import { templeWalletApi } from './templewallet.api';

export interface SliseAdStylesOverrides {
  parentDepth: number;
  style: Record<string, string>;
}

interface RawSliseAdPlacesRule {
  urlRegexes: string[];
  selector: {
    isMultiple: boolean;
    cssString: string;
    parentDepth: number;
    shouldUseDivWrapper: boolean;
    divWrapperStyle?: Record<string, string>;
  };
  stylesOverrides?: SliseAdStylesOverrides[];
}

export interface SliseAdPlacesRule extends Omit<RawSliseAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
}

interface RawSliseAdProvidersRule {
  urlRegexes: string[];
  providers: string[];
}

const identityFn = <T>(data: T) => data;

const parseUrlRegexesProperty = <T extends { urlRegexes: string[] }>({ urlRegexes, ...rest }: T) => ({
  ...rest,
  urlRegexes: urlRegexes.map(regex => new RegExp(regex))
});

const withFetchDataProcessing =
  <R, A extends unknown[], T>(fetchFn: (...args: A) => Promise<AxiosResponse<R>>, transformFn: (rawData: R) => T) =>
  async (...args: A) => {
    const { data } = await fetchFn(...args);

    return transformFn(data);
  };

export const getAdPlacesRulesByDomain = withFetchDataProcessing(
  (domainName: string) => templeWalletApi.get<RawSliseAdPlacesRule[]>(`/slise-ad-rules/ad-places/${domainName}`),
  rawRules => rawRules.map(parseUrlRegexesProperty)
);

export const getProvidersToReplaceAtAllSites = withFetchDataProcessing(
  () => templeWalletApi.get<string[]>('/slise-ad-rules/providers/all-sites'),
  identityFn
);

export const getProvidersRulesByDomain = withFetchDataProcessing(
  (domainName: string) =>
    templeWalletApi.get<RawSliseAdProvidersRule[]>(`/slise-ad-rules/providers/by-sites/${domainName}`),
  rawRules => rawRules.map(rawRule => ({ ...rawRule, urlRegexes: rawRule.urlRegexes.map(regex => new RegExp(regex)) }))
);

export const getSelectorsForAllProviders = withFetchDataProcessing(
  () => templeWalletApi.get<Record<string, string[]>>('/slise-ad-rules/providers'),
  identityFn
);
