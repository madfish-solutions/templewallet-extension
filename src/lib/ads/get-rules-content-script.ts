import { isEqual } from 'lodash';
import memoizee from 'memoizee';
import browser from 'webextension-polyfill';

import type { RawAdPlacesRule, RawAdProvidersRule, RawPermanentAdPlacesRule } from 'lib/apis/temple';
import { ALL_ADS_RULES_STORAGE_KEY, ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';

interface RawAllAdsRules {
  adPlacesRulesForAllDomains: Record<string, RawAdPlacesRule[]>;
  providersRulesForAllDomains: Record<string, RawAdProvidersRule[]>;
  providersSelectors: Record<string, string[]>;
  providersToReplaceAtAllSites: string[];
  permanentAdPlacesRulesForAllDomains: Record<string, RawPermanentAdPlacesRule[]>;
  permanentNativeAdPlacesRulesForAllDomains: Record<string, RawPermanentAdPlacesRule[]>;
  timestamp: number;
}

interface AdPlacesRule extends Omit<RawAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
}

interface PermanentAdPlacesRule extends Omit<RawPermanentAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
  isNative: boolean;
}

export interface AdsRules {
  adPlacesRules: Array<Omit<AdPlacesRule, 'urlRegexes'>>;
  permanentAdPlacesRules: PermanentAdPlacesRule[];
  providersSelector: string;
  timestamp: number;
}

export const getRulesFromContentScript = memoizee(
  async (location: Location): Promise<AdsRules> => {
    try {
      const storageContent = await browser.storage.local.get(ALL_ADS_RULES_STORAGE_KEY);
      const rules: RawAllAdsRules = storageContent[ALL_ADS_RULES_STORAGE_KEY] ?? {
        adPlacesRulesForAllDomains: {},
        providersRulesForAllDomains: [],
        providersSelectors: {},
        providersToReplaceAtAllSites: [],
        permanentAdPlacesRulesForAllDomains: {},
        permanentNativeAdPlacesRulesForAllDomains: {},
        timestamp: 0
      };
      const {
        adPlacesRulesForAllDomains,
        providersRulesForAllDomains,
        providersSelectors,
        providersToReplaceAtAllSites,
        permanentAdPlacesRulesForAllDomains,
        permanentNativeAdPlacesRulesForAllDomains = {},
        timestamp
      } = rules;
      const { hostname, href } = location;
      const hrefWithoutHash = href.replace(/#.*$/, '');
      const hrefMatchPredicate = (regex: RegExp) => {
        const hrefToTest = regex.source.includes('#') ? href : hrefWithoutHash;

        return regex.test(hrefToTest);
      };

      const adPlacesRules = (adPlacesRulesForAllDomains[hostname] ?? []).map(({ urlRegexes, ...restRuleProps }) => ({
        ...restRuleProps,
        urlRegexes: urlRegexes.map(regex => new RegExp(regex))
      }));
      const providersRules = (providersRulesForAllDomains[hostname] ?? []).map(({ urlRegexes, ...restRuleProps }) => ({
        ...restRuleProps,
        urlRegexes: urlRegexes.map(regex => new RegExp(regex))
      }));
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

      const aggregatedRelatedAdPlacesRules = adPlacesRules.reduce<Array<Omit<AdPlacesRule, 'urlRegexes'>>>(
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

      return {
        adPlacesRules: aggregatedRelatedAdPlacesRules,
        permanentAdPlacesRules: permanentAdPlacesRules.filter(({ urlRegexes }) => urlRegexes.some(hrefMatchPredicate)),
        providersSelector,
        timestamp
      };
    } catch (e) {
      console.error(e);

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
