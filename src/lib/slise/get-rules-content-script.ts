import { isEqual } from 'lodash';
import memoizee from 'memoizee';
import browser from 'webextension-polyfill';

import type { RawSliseAdPlacesRule, RawSliseAdProvidersRule, RawPermanentSliseAdPlacesRule } from 'lib/apis/temple';
import { ALL_SLISE_ADS_RULES_STORAGE_KEY, SLISE_ADS_RULES_UPDATE_INTERVAL } from 'lib/constants';

interface RawAllSliseAdsRules {
  adPlacesRulesForAllDomains: Record<string, RawSliseAdPlacesRule[]>;
  providersRulesForAllDomains: Record<string, RawSliseAdProvidersRule[]>;
  providersSelectors: Record<string, string[]>;
  providersToReplaceAtAllSites: string[];
  permanentAdPlacesRulesForAllDomains: Record<string, RawPermanentSliseAdPlacesRule[]>;
  timestamp: number;
}

interface SliseAdPlacesRule extends Omit<RawSliseAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
}

interface PermanentSliseAdPlacesRule extends Omit<RawPermanentSliseAdPlacesRule, 'urlRegexes'> {
  urlRegexes: RegExp[];
}

export interface SliseAdsRules {
  adPlacesRules: Array<Omit<SliseAdPlacesRule, 'urlRegexes'>>;
  permanentAdPlacesRules: PermanentSliseAdPlacesRule[];
  providersSelector: string;
  timestamp: number;
}

export const getRulesFromContentScript = memoizee(
  async (location: Location): Promise<SliseAdsRules> => {
    try {
      const storageContent = await browser.storage.local.get(ALL_SLISE_ADS_RULES_STORAGE_KEY);
      const rules: RawAllSliseAdsRules = storageContent[ALL_SLISE_ADS_RULES_STORAGE_KEY] ?? {
        adPlacesRulesForAllDomains: {},
        providersRulesForAllDomains: [],
        providersSelectors: {},
        providersToReplaceAtAllSites: [],
        permanentAdPlacesRulesForAllDomains: {},
        timestamp: 0
      };
      const {
        adPlacesRulesForAllDomains,
        providersRulesForAllDomains,
        providersSelectors,
        providersToReplaceAtAllSites,
        permanentAdPlacesRulesForAllDomains,
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
      const permanentAdPlacesRules = (permanentAdPlacesRulesForAllDomains[hostname] ?? []).map(
        ({ urlRegexes, ...restRuleProps }) => ({
          ...restRuleProps,
          urlRegexes: urlRegexes.map(regex => new RegExp(regex))
        })
      );

      const aggregatedRelatedAdPlacesRules = adPlacesRules.reduce<Array<Omit<SliseAdPlacesRule, 'urlRegexes'>>>(
        (acc, { urlRegexes, selector, stylesOverrides }) => {
          if (!urlRegexes.some(hrefMatchPredicate)) return acc;

          const { cssString, ...restSelectorProps } = selector;
          const ruleToComplementIndex = acc.findIndex(
            ({ selector: candidateSelector, stylesOverrides: candidateStylesOverrides }) => {
              const { cssString: _candidateCssString, ...restCandidateSelectorProps } = candidateSelector;

              return (
                isEqual(restSelectorProps, restCandidateSelectorProps) &&
                isEqual(stylesOverrides, candidateStylesOverrides)
              );
            }
          );
          if (ruleToComplementIndex === -1) {
            acc.push({ stylesOverrides, selector });
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
  { maxAge: SLISE_ADS_RULES_UPDATE_INTERVAL, normalizer: ([location]) => location.href, promise: true }
);

export const clearRulesCache = () => getRulesFromContentScript.clear();
