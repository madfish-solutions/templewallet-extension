import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { SELECTOR_STORAGE_VERSION, SelectorStorage } from 'lib/ads/selector-feeds';
import { getOfflineSelectorStorage } from 'lib/ads/selector-snapshot';
import { AD_SELECTORS_STORAGE_KEY } from 'lib/constants';
import { IS_DEV_ENV } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';

interface CachedSelectorStorage {
  storage: SelectorStorage;
  source: 'stored' | 'offline';
}

let cache: Promise<CachedSelectorStorage> | undefined;
let cacheGeneration = 0;
type ResolvedSelectors = ReturnType<Awaited<ReturnType<typeof importExtensionAdsModule>>['resolveSelectorSnapshot']>;
let effective:
  | { key: string; value: ReturnType<Awaited<ReturnType<typeof importExtensionAdsModule>>['resolveSelectorSnapshot']> }
  | undefined;

export const getRulesFromStorage = async (locationOrHref: Location | string): Promise<ResolvedSelectors> => {
  const generation = cacheGeneration;
  const { resolveSelectorSnapshot, setWebsiteSelectorRules, SELECTOR_SCHEMA_VERSION, SELECTOR_PARSER_VERSION } =
    await importExtensionAdsModule();
  const { storage, source } = await (cache ??= fetchFromStorage<SelectorStorage>(AD_SELECTORS_STORAGE_KEY).then(
    async (stored): Promise<CachedSelectorStorage> => {
      if (
        stored?.migrationVersion === SELECTOR_STORAGE_VERSION &&
        stored.snapshot?.schemaVersion === SELECTOR_SCHEMA_VERSION &&
        stored.snapshot.parserVersion === SELECTOR_PARSER_VERSION
      ) {
        return { storage: stored, source: 'stored' };
      }
      return { storage: await getOfflineSelectorStorage(), source: 'offline' };
    }
  ));
  const href = typeof locationOrHref === 'string' ? locationOrHref : locationOrHref.href;
  if (generation !== cacheGeneration) return getRulesFromStorage(href);
  const key = `${storage.snapshot.revision}:${href}`;
  if (effective?.key !== key) {
    effective = { key, value: resolveSelectorSnapshot(storage.snapshot, href) };
    if (IS_DEV_ENV) {
      console.info('[Temple Ads] selectors-resolved', {
        hostname: new URL(href).hostname,
        source,
        revision: effective.value.revision,
        overrideRevision: storage.snapshot.overrideRevision,
        disabled: effective.value.disabled,
        genericDisabled: effective.value.genericDisabled,
        selectorCount: effective.value.selectors.length,
        templeSelectors: effective.value.selectors
          .filter(rule => rule.origins.some(origin => origin.feedId === 'temple'))
          .map(rule => rule.selector)
      });
    }
  }
  setWebsiteSelectorRules(effective.value);
  return effective.value;
};

export const clearRulesCache = () => {
  cacheGeneration++;
  cache = undefined;
  effective = undefined;
};
