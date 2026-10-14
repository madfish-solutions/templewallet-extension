import { importExtensionAdsModule } from './import-extension-ads-module';
import { checksumSelectorText, SELECTOR_FEEDS, SelectorFeedState, SelectorStorage } from './selector-feeds';
import offlineText from './selectors/easylist-minimum.txt?raw';
import overridesText from './selectors/temple-overrides.txt?raw';

export const compileSelectorStorage = async (feeds: Record<string, SelectorFeedState>): Promise<SelectorStorage> => {
  feeds = Object.fromEntries(SELECTOR_FEEDS.filter(feed => feeds[feed.id]).map(feed => [feed.id, feeds[feed.id]]));
  const { parseSelectorFeed, SELECTOR_SCHEMA_VERSION, SELECTOR_PARSER_VERSION, SELECTOR_LIMITS } =
    await importExtensionAdsModule();
  const overrides = parseSelectorFeed(overridesText, 'temple', true);
  const overrideRevision = await checksumSelectorText(overridesText);
  const selected = SELECTOR_FEEDS.filter(feed => feed.enabled && feeds[feed.id]);
  const parsed = selected.map(feed => feeds[feed.id].parsed);
  const feedVersions = Object.fromEntries(selected.map(feed => [feed.id, feeds[feed.id].checksum]));
  const revision = await checksumSelectorText(
    JSON.stringify([SELECTOR_SCHEMA_VERSION, SELECTOR_PARSER_VERSION, feedVersions, overrideRevision])
  );
  const storage: SelectorStorage = {
    migrationVersion: 1,
    registry: SELECTOR_FEEDS,
    feeds,
    snapshot: {
      schemaVersion: SELECTOR_SCHEMA_VERSION,
      parserVersion: SELECTOR_PARSER_VERSION,
      revision,
      feedVersions,
      overrideRevision,
      rules: [...parsed.flatMap(feed => feed.rules), ...overrides.rules],
      pageExceptions: [...parsed.flatMap(feed => feed.pageExceptions), ...overrides.pageExceptions]
    }
  };
  const { rules, pageExceptions } = storage.snapshot;
  if (
    rules.length + pageExceptions.length > SELECTOR_LIMITS.rules ||
    rules.filter(rule => rule.kind === 'exception').length + pageExceptions.length > SELECTOR_LIMITS.exceptions
  ) {
    throw new Error('Aggregate selector rule limit');
  }
  if (new TextEncoder().encode(JSON.stringify(storage)).length > SELECTOR_LIMITS.snapshotBytes)
    throw new Error('Selector storage byte limit');
  return storage;
};

let offline: Promise<SelectorStorage> | undefined;
export const getOfflineSelectorStorage = (): Promise<SelectorStorage> =>
  (offline ??= (async () => {
    const { parseSelectorFeed } = await importExtensionAdsModule();
    const parsed = parseSelectorFeed(offlineText, 'easylist');
    return compileSelectorStorage({
      easylist: {
        parsed,
        sourceVersion: parsed.sourceVersion,
        checksum: await checksumSelectorText(offlineText),
        lastCheckedAt: 0,
        lastSuccessfulAt: 0,
        nextCheckAt: 0,
        failures: 0
      }
    });
  })());
