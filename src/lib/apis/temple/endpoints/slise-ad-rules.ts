import { AxiosResponse } from 'axios';

import { templeWalletApi } from './templewallet.api';

export interface SliseAdStylesOverrides {
  parentDepth: number;
  style: Record<string, string>;
}

export interface RawSliseAdPlacesRule {
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

export interface RawSliseAdProvidersRule {
  urlRegexes: string[];
  providers: string[];
}

const withFetchDataExtraction =
  <A extends unknown[], T>(fetchFn: (...args: A) => Promise<AxiosResponse<T>>) =>
  async (...args: A) => {
    const { data } = await fetchFn(...args);

    return data;
  };

export const getAdPlacesRulesForAllDomains = withFetchDataExtraction(() =>
  templeWalletApi.get<Record<string, RawSliseAdPlacesRule[]>>('/slise-ad-rules/ad-places')
);

export const getProvidersToReplaceAtAllSites = withFetchDataExtraction(() =>
  templeWalletApi.get<string[]>('/slise-ad-rules/providers/all-sites')
);

export const getProvidersRulesForAllDomains = withFetchDataExtraction(() =>
  templeWalletApi.get<Record<string, RawSliseAdProvidersRule[]>>(`/slise-ad-rules/providers/by-sites`)
);

export const getSelectorsForAllProviders = withFetchDataExtraction(() =>
  templeWalletApi.get<Record<string, string[]>>('/slise-ad-rules/providers')
);
