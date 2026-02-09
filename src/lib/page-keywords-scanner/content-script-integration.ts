/**
 * Content script integration for the page keywords scanner.
 * Manages the lifecycle of the scanner and communicates with the background script.
 */

import browser from 'webextension-polyfill';

import { ContentScriptType, PAGE_KEYWORDS_SCANNER_ENABLED } from 'lib/constants';

import type { ScanResult } from './keyword-scanner';
import { createPageScanner, PageScanner } from './page-scanner';

/**
 * Domains to exclude from keyword scanning.
 */
const EXCLUDED_DOMAINS = [
  'templewallet.com',
  'temple.finance',
  'netlify.app',
  'vercel.app',
  'chrome-extension://',
  'moz-extension://',
  'localhost',
  '127.0.0.1'
];

function shouldExcludePage(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  const href = window.location.href.toLowerCase();

  return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain) || href.includes(domain));
}

export interface PageKeywordsData {
  url: string;
  hostname: string;
  timestamp: number;
  result: ScanResult;
}

let scanner: PageScanner | null = null;
let isInitialized = false;
let lastScannedUrl = '';

/**
 * Initializes the page keywords scanner if enabled.
 * Should be called from the content script's main entry.
 */
export async function initPageKeywordsScanner(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  try {
    if (shouldExcludePage()) {
      console.debug('[PageKeywordsScanner] Skipping excluded domain:', window.location.hostname);
      return;
    }

    const storage = await browser.storage.local.get(PAGE_KEYWORDS_SCANNER_ENABLED);
    const isEnabled = storage[PAGE_KEYWORDS_SCANNER_ENABLED];

    if (!isEnabled) {
      console.debug('[PageKeywordsScanner] Feature is disabled');
      return;
    }

    scanner = createPageScanner({
      debounceMs: 500,
      maxKeywords: 50,
      debug: process.env.NODE_ENV === 'development',
      onUpdate: handleScanUpdate
    });

    setupSpaNavigationDetection();

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startScanning);
    } else {
      startScanning();
    }
  } catch (error) {
    console.error('[PageKeywordsScanner] Failed to initialize:', error);
  }
}

/**
 * Sets up detection for SPA (Single Page Application) navigation.
 * Detects URL changes without full page reloads.
 */
function setupSpaNavigationDetection(): void {
  lastScannedUrl = window.location.href;

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleUrlChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleUrlChange();
  };

  window.addEventListener('popstate', handleUrlChange);
}

/**
 * Handles URL changes in SPAs by re-scanning after content settles.
 */
function handleUrlChange(): void {
  const currentUrl = window.location.href;

  // Only re-scan if URL actually changed (ignoring hash changes)
  const urlWithoutHash = (url: string) => url.split('#')[0];
  if (urlWithoutHash(currentUrl) === urlWithoutHash(lastScannedUrl)) {
    return;
  }

  lastScannedUrl = currentUrl;
  console.debug('[PageKeywordsScanner] URL changed, re-scanning:', currentUrl);

  setTimeout(() => {
    if (scanner) {
      scanner.scan();
    }
  }, 1000);
}

function startScanning(): void {
  if (!scanner) return;

  const result = scanner.scan();

  scanner.startObserving();
  if (result.uniqueCount === 0) {
    setTimeout(() => {
      if (scanner && scanner.getResult().uniqueCount === 0) {
        scanner.stopObserving();
        console.debug('[PageKeywordsScanner] No keywords found, stopped observing');
      }
    }, 15000);
  }
}

function handleScanUpdate(result: ScanResult): void {
  if (result.uniqueCount === 0) return;

  const data: PageKeywordsData = {
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: Date.now(),
    result
  };

  browser.runtime
    .sendMessage({
      type: ContentScriptType.PageKeywordsUpdate,
      data
    })
    .catch(error => {
      console.debug('[PageKeywordsScanner] Failed to send update:', error);
    });
}

// export function destroyScanner(): void {
//   if (scanner) {
//     scanner.destroy();
//     scanner = null;
//   }
//   isInitialized = false;
// }
