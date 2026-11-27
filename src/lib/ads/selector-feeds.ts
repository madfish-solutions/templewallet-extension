// oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore Optional package is absent from core builds.
import type { ParsedSelectorFeed, SelectorSnapshot } from '@temple-wallet/extension-ads';

import { EnvVars } from 'lib/env';

export const SELECTOR_STORAGE_VERSION = 2;
export const TEMPLE_SELECTOR_FEED_ID = 'temple';
const TEMPLE_SELECTOR_FORMAT_VERSION = 1;

export const supportsTempleSelectorFeed = (adsModule: object): boolean =>
  Reflect.get(adsModule, 'TEMPLE_SELECTOR_FORMAT_VERSION') === TEMPLE_SELECTOR_FORMAT_VERSION;

export interface SelectorFeedDefinition {
  id: string;
  url: string;
  refreshMs: number;
  license?: string;
  enabled: boolean;
}

export interface SelectorFeedState {
  sourceVersion: string;
  etag?: string;
  lastModified?: string;
  lastCheckedAt: number;
  lastSuccessfulAt: number;
  nextCheckAt: number;
  failures: number;
  checksum: string;
  parsed: ParsedSelectorFeed;
  error?: string;
  countChange?: number;
}

export interface SelectorStorage {
  migrationVersion: typeof SELECTOR_STORAGE_VERSION;
  registry: SelectorFeedDefinition[];
  feeds: Record<string, SelectorFeedState>;
  snapshot: SelectorSnapshot;
}

export interface SelectorRefreshResult {
  status: 'success' | 'partial' | 'unchanged' | 'failure';
  revision: string;
  errors: string[];
}

export const SELECTOR_FEEDS: SelectorFeedDefinition[] = [
  {
    id: 'easylist',
    url: 'https://easylist.to/easylist/easylist.txt',
    refreshMs: 4 * 24 * 60 * 60 * 1000,
    license: 'CC-BY-SA-3.0; The EasyList authors (https://easylist.to/)',
    enabled: true
  },
  {
    id: TEMPLE_SELECTOR_FEED_ID,
    url: `${EnvVars.TEMPLE_ADS_API_URL?.replace(/\/+$/, '')}/ads-config/v${TEMPLE_SELECTOR_FORMAT_VERSION}/temple-overrides.txt`,
    refreshMs: 60 * 60 * 1000,
    enabled: Boolean(EnvVars.TEMPLE_ADS_API_URL)
  }
];

export const checksumSelectorText = async (text: string): Promise<string> => {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};
