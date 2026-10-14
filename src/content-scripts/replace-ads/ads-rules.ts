import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';
import { SelectorStorage } from 'lib/ads/selector-feeds';
import { getOfflineSelectorStorage } from 'lib/ads/selector-snapshot';
import { AD_SELECTORS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';

let cache: Promise<SelectorStorage> | undefined;
let cacheGeneration = 0;
type ResolvedSelectors = ReturnType<Awaited<ReturnType<typeof importExtensionAdsModule>>['resolveSelectorSnapshot']>;
let effective:
  | { key: string; value: ReturnType<Awaited<ReturnType<typeof importExtensionAdsModule>>['resolveSelectorSnapshot']> }
  | undefined;

export const getRulesFromStorage = async (locationOrHref: Location | string): Promise<ResolvedSelectors> => {
  const generation = cacheGeneration;
  const { resolveSelectorSnapshot, setWebsiteSelectorRules, SELECTOR_SCHEMA_VERSION, SELECTOR_PARSER_VERSION } =
    await importExtensionAdsModule();
  const storage = await (cache ??= fetchFromStorage<SelectorStorage>(AD_SELECTORS_STORAGE_KEY).then(stored =>
    stored?.snapshot?.schemaVersion === SELECTOR_SCHEMA_VERSION &&
    stored.snapshot.parserVersion === SELECTOR_PARSER_VERSION
      ? stored
      : getOfflineSelectorStorage()
  ));
  const href = typeof locationOrHref === 'string' ? locationOrHref : locationOrHref.href;
  if (generation !== cacheGeneration) return getRulesFromStorage(href);
  const key = `${storage.snapshot.revision}:${href}`;
  if (effective?.key !== key) effective = { key, value: resolveSelectorSnapshot(storage.snapshot, href) };
  setWebsiteSelectorRules(effective.value);
  return effective.value;
};

export const clearRulesCache = () => {
  cacheGeneration++;
  cache = undefined;
  effective = undefined;
};
