import { isEqual } from 'lodash';
import memoizee from 'memoizee';

import type { RawAdPlacesRule, RawAdProvidersRule, RawPermanentAdPlacesRule } from 'lib/apis/temple';
import { ALL_ADS_RULES_STORAGE_KEY, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

interface RawAllAdsRules {
  adPlacesRulesForAllDomains: StringRecord<RawAdPlacesRule[]>;
  providersRulesForAllDomains: StringRecord<RawAdProvidersRule[]>;
  providersSelectors: StringRecord<string[]>;
  providersToReplaceAtAllSites: string[];
  permanentAdPlacesRulesForAllDomains: StringRecord<RawPermanentAdPlacesRule[]>;
  permanentNativeAdPlacesRulesForAllDomains?: StringRecord<RawPermanentAdPlacesRule[]>;
  timestamp: number;
}

interface AdPlacesRule extends Omit<RawAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
}

export interface PermanentAdPlacesRule extends Omit<RawPermanentAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
  isNative: boolean;
}

export interface AdsRules {
  adPlacesRules: Omit<AdPlacesRule, 'urlRegexes'>[];
  permanentAdPlacesRules: PermanentAdPlacesRule[];
  providersSelector: string;
  timestamp: number;
}

export const getRulesFromContentScript = memoizee(
  async (location: Location): Promise<AdsRules> => {
    try {
      const rulesStored = await fetchFromStorage<RawAllAdsRules>(ALL_ADS_RULES_STORAGE_KEY);

      if (!rulesStored) throw new Error('No rules for ads found');

      return transformRawRules(location, rulesStored);
    } catch (error) {
      console.error(error);

      return {
        adPlacesRules: [],
        permanentAdPlacesRules: [],
        providersSelector: '',
        timestamp: 0
      };
    }
  },
  { maxAge: ADS_RULES_UPDATE_INTERVAL, normalizer: ([location]) => location.href, promise: true }
);

export const clearRulesCache = () => getRulesFromContentScript.clear();

const transformRawRules = (
  location: Location,
  {
    adPlacesRulesForAllDomains,
    providersRulesForAllDomains,
    providersSelectors,
    providersToReplaceAtAllSites,
    permanentAdPlacesRulesForAllDomains,
    permanentNativeAdPlacesRulesForAllDomains,
    timestamp
  }: RawAllAdsRules
): AdsRules => {
  const { hostname, href } = location;
  const hrefWithoutHash = href.replace(/#.*$/, '');

  const hrefMatchPredicate = (regex: RegExp) => {
    const hrefToTest = regex.source.includes('#') ? href : hrefWithoutHash;

    return regex.test(hrefToTest);
  };

  return {
    adPlacesRules: buildAdPlacesRules(hostname, hrefMatchPredicate, adPlacesRulesForAllDomains),
    permanentAdPlacesRules: buildPermanentAdPlacesRules(
      hostname,
      hrefMatchPredicate,
      permanentAdPlacesRulesForAllDomains,
      permanentNativeAdPlacesRulesForAllDomains
    ),
    providersSelector: buildProvidersSelector(
      hostname,
      hrefMatchPredicate,
      providersRulesForAllDomains,
      providersSelectors,
      providersToReplaceAtAllSites
    ),
    timestamp
  };
};

const buildAdPlacesRules = (
  hostname: string,
  hrefMatchPredicate: (regex: RegExp) => boolean,
  adPlacesRulesForAllDomains: RawAllAdsRules['adPlacesRulesForAllDomains']
): AdsRules['adPlacesRules'] => {
  const adPlacesRules = (adPlacesRulesForAllDomains[hostname] ?? []).map(({ urlRegexes, ...restRuleProps }) => ({
    ...restRuleProps,
    urlRegexes: urlRegexes.map(regex => new RegExp(regex))
  }));

  const aggregatedRelatedAdPlacesRules = adPlacesRules.reduce<Omit<AdPlacesRule, 'urlRegexes'>[]>(
    (acc, { urlRegexes, selector, ...restProps }) => {
      if (!urlRegexes.some(hrefMatchPredicate)) return acc;

      const { cssString, ...restSelectorProps } = selector;
      const ruleToComplementIndex = acc.findIndex(({ selector: candidateSelector, ...candidateRestProps }) => {
        const { cssString: _candidateCssString, ...restCandidateSelectorProps } = candidateSelector;

        return isEqual(restSelectorProps, restCandidateSelectorProps) && isEqual(restProps, candidateRestProps);
      });
      if (ruleToComplementIndex === -1) {
        acc.push({ selector, ...restProps });
      } else {
        acc[ruleToComplementIndex].selector.cssString += ', '.concat(cssString);
      }

      return acc;
    },
    []
  );

  return aggregatedRelatedAdPlacesRules;
};

const buildPermanentAdPlacesRules = (
  hostname: string,
  hrefMatchPredicate: (regex: RegExp) => boolean,
  permanentAdPlacesRulesForAllDomains: RawAllAdsRules['permanentAdPlacesRulesForAllDomains'],
  permanentNativeAdPlacesRulesForAllDomains: RawAllAdsRules['permanentNativeAdPlacesRulesForAllDomains'] = {}
): AdsRules['permanentAdPlacesRules'] => {
  const rawPermanentAdPlacesRules = permanentAdPlacesRulesForAllDomains[hostname] ?? [];
  const rawPermanentNativeAdPlacesRules = permanentNativeAdPlacesRulesForAllDomains[hostname] ?? [];

  const permanentAdPlacesRules = rawPermanentAdPlacesRules
    .map(({ urlRegexes, ...restRuleProps }) => ({
      ...restRuleProps,
      urlRegexes: urlRegexes.map(regex => new RegExp(regex)),
      isNative: false
    }))
    .concat(
      rawPermanentNativeAdPlacesRules.map(({ urlRegexes, ...restRuleProps }) => ({
        ...restRuleProps,
        urlRegexes: urlRegexes.map(regex => new RegExp(regex)),
        isNative: true
      }))
    );

  return permanentAdPlacesRules.filter(({ urlRegexes }) => urlRegexes.some(hrefMatchPredicate));
};

const buildProvidersSelector = (
  hostname: string,
  hrefMatchPredicate: (regex: RegExp) => boolean,
  providersRulesForAllDomains: RawAllAdsRules['providersRulesForAllDomains'],
  providersSelectors: RawAllAdsRules['providersSelectors'],
  providersToReplaceAtAllSites: RawAllAdsRules['providersToReplaceAtAllSites']
): string => {
  const providersRules = (providersRulesForAllDomains[hostname] ?? []).map(({ urlRegexes, ...restRuleProps }) => ({
    ...restRuleProps,
    urlRegexes: urlRegexes.map(regex => new RegExp(regex))
  }));

  const relatedProvidersRules = providersRules.filter(({ urlRegexes }) => urlRegexes.some(hrefMatchPredicate));
  const alreadyProcessedProviders = new Set<string>();
  const selectorsForProvidersToReplace = new Set<string>();
  const handleProvider = (provider: string) => {
    if (alreadyProcessedProviders.has(provider)) return;

    const newSelectors = providersSelectors[provider] ?? [];
    newSelectors.forEach(selector => selectorsForProvidersToReplace.add(selector));
    alreadyProcessedProviders.add(provider);
  };

  providersToReplaceAtAllSites.forEach(handleProvider);
  relatedProvidersRules.forEach(({ providers }) => providers.forEach(handleProvider));

  let providersSelector = '';
  selectorsForProvidersToReplace.forEach(selector => {
    providersSelector += selector + ', ';
  });
  if (providersSelector) {
    providersSelector = providersSelector.slice(0, -2);
  }

  return providersSelector;
};
