import { useEffect, useState, useCallback, useMemo } from 'react';

import browser from 'webextension-polyfill';

import {
  PAGE_KEYWORDS_SCANNER_ENABLED,
  PAGE_KEYWORDS_STORAGE_KEY,
  SUGGESTIONS_CONFIG,
  TRADING_SUGGESTIONS_STORAGE_KEY
} from 'lib/constants';
import type { PageAnalysis, PageKeywordsData, TradingSuggestion } from 'lib/page-keywords-scanner';

/** A single stored suggestion entry */
interface StoredSuggestionEntry {
  urlKey: string;
  url: string;
  hostname: string;
  timestamp: number;
  expiresAt: number;
  analysis: PageAnalysis;
  suggestions: TradingSuggestion[];
}

/** Map of urlKey -> suggestion entry */
type StoredSuggestionsMap = Record<string, StoredSuggestionEntry>;

interface UsePageKeywordsResult {
  /** Keywords data for the current/recent page (only if matches active tab) */
  data: PageKeywordsData | null;
  /** Trading suggestion for the active tab's page (if any, and not expired) */
  currentSuggestion: StoredSuggestionEntry | null;
  /** All stored (non-expired) suggestions */
  allSuggestions: StoredSuggestionEntry[];
  /** Whether the feature is enabled */
  isEnabled: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether stored data is stale (from a different page than the active tab) */
  isDataStale: boolean;
  /** Refresh the keywords data */
  refresh: () => Promise<void>;
  /** Enable/disable the entire feature */
  setEnabled: (enabled: boolean) => Promise<void>;
}

const STORAGE_KEYS = [PAGE_KEYWORDS_STORAGE_KEY, PAGE_KEYWORDS_SCANNER_ENABLED, TRADING_SUGGESTIONS_STORAGE_KEY];

/**
 * Gets the URL key for matching suggestions to a page.
 */
function getUrlKey(url: string): string {
  try {
    const parsed = new URL(url);

    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Filters out expired suggestions from the map.
 */
function getValidSuggestions(map: StoredSuggestionsMap | null): StoredSuggestionEntry[] {
  if (!map) return [];

  const now = Date.now();

  return Object.values(map)
    .filter(entry => entry.expiresAt > now)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Gets the active tab's URL.
 */
async function getActiveTabUrl(): Promise<string | null> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    return tabs[0]?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Hook to access page keywords scanner data and settings.
 * Detects if stored data matches the active tab and flags stale data.
 */
export function usePageKeywords(): UsePageKeywordsResult {
  const [rawData, setRawData] = useState<PageKeywordsData | null>(null);
  const [suggestionsMap, setSuggestionsMap] = useState<StoredSuggestionsMap | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [storage, tabUrl] = await Promise.all([browser.storage.local.get(STORAGE_KEYS), getActiveTabUrl()]);

      setRawData(storage[PAGE_KEYWORDS_STORAGE_KEY] ?? null);
      setIsEnabled(storage[PAGE_KEYWORDS_SCANNER_ENABLED] ?? false);
      setSuggestionsMap(storage[TRADING_SUGGESTIONS_STORAGE_KEY] ?? null);
      setActiveTabUrl(tabUrl);
    } catch (error) {
      console.error('[usePageKeywords] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadData();
  }, [loadData]);

  const setEnabled = useCallback(async (enabled: boolean) => {
    try {
      await browser.storage.local.set({ [PAGE_KEYWORDS_SCANNER_ENABLED]: enabled });
      setIsEnabled(enabled);

      if (!enabled) {
        await browser.storage.local.remove([PAGE_KEYWORDS_STORAGE_KEY, TRADING_SUGGESTIONS_STORAGE_KEY]);
        setRawData(null);
        setSuggestionsMap(null);
      }
    } catch (error) {
      console.error('[usePageKeywords] Failed to update enabled state:', error);
    }
  }, []);

  // Check if stored keywords match the active tab
  const isDataStale = useMemo(() => {
    if (!rawData?.url || !activeTabUrl) return false;

    return getUrlKey(rawData.url) !== getUrlKey(activeTabUrl);
  }, [rawData, activeTabUrl]);

  // Only return data if it matches active tab (not stale)
  const data = useMemo(() => {
    if (isDataStale) return null;

    return rawData;
  }, [rawData, isDataStale]);

  // Get all valid (non-expired) suggestions
  const allSuggestions = useMemo(() => getValidSuggestions(suggestionsMap), [suggestionsMap]);

  // Find suggestion matching the active tab URL (not the stored data URL)
  const currentSuggestion = useMemo(() => {
    if (!activeTabUrl || !suggestionsMap) return null;

    const urlKey = getUrlKey(activeTabUrl);
    const entry = suggestionsMap[urlKey];
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) return null;

    return entry;
  }, [activeTabUrl, suggestionsMap]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodically clean expired suggestions
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!suggestionsMap) return;

      const now = Date.now();
      let hasExpired = false;

      for (const entry of Object.values(suggestionsMap)) {
        if (entry.expiresAt <= now) {
          hasExpired = true;
          break;
        }
      }

      if (hasExpired) {
        const cleaned: StoredSuggestionsMap = {};
        for (const [key, entry] of Object.entries(suggestionsMap)) {
          if (entry.expiresAt > now) {
            cleaned[key] = entry;
          }
        }
        setSuggestionsMap(cleaned);
        await browser.storage.local.set({ [TRADING_SUGGESTIONS_STORAGE_KEY]: cleaned });
      }
    }, SUGGESTIONS_CONFIG.SUGGESTION_TTL_MS / 2);

    return () => clearInterval(interval);
  }, [suggestionsMap]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes: Record<string, browser.Storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;

      if (PAGE_KEYWORDS_STORAGE_KEY in changes) {
        setRawData(changes[PAGE_KEYWORDS_STORAGE_KEY].newValue ?? null);
      }

      if (PAGE_KEYWORDS_SCANNER_ENABLED in changes) {
        setIsEnabled(changes[PAGE_KEYWORDS_SCANNER_ENABLED].newValue ?? false);
      }

      if (TRADING_SUGGESTIONS_STORAGE_KEY in changes) {
        setSuggestionsMap(changes[TRADING_SUGGESTIONS_STORAGE_KEY].newValue ?? null);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    data,
    currentSuggestion,
    allSuggestions,
    isEnabled,
    isLoading,
    isDataStale,
    refresh,
    setEnabled
  };
}
