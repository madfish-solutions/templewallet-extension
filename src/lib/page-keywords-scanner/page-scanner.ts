/**
 * Main page scanner that orchestrates text extraction and keyword scanning.
 * Handles initial scan and dynamic content updates via MutationObserver.
 */

import { scanForKeywords, mergeScanResults, ScanResult, containsCryptoKeywords } from './keyword-scanner';
import { extractVisibleText, extractTextFromElement } from './text-extractor';

interface PageScannerOptions {
  /** Debounce time for mutation updates (ms) */
  debounceMs?: number;
  /** Maximum keywords to track */
  maxKeywords?: number;
  /** Callback when scan results are updated */
  onUpdate?: (result: ScanResult) => void;
  /** Enable debug logging */
  debug?: boolean;
}

const DEFAULT_OPTIONS: Required<PageScannerOptions> = {
  debounceMs: 500,
  maxKeywords: 50,
  onUpdate: () => {},
  debug: false
};

export class PageScanner {
  private options: Required<PageScannerOptions>;
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentResult: ScanResult;
  private pendingElements: Set<Element> = new Set();
  private isScanning = false;
  private scannedText = new Set<string>(); // Track already scanned text chunks

  constructor(options: PageScannerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.currentResult = {
      keywords: [],
      snippets: [],
      uniqueCount: 0,
      totalMatches: 0,
      categories: [],
      scanTimeMs: 0
    };
  }

  scan(): ScanResult {
    if (this.isScanning) {
      this.log('Scan already in progress, skipping');
      return this.currentResult;
    }

    this.isScanning = true;
    const startTime = performance.now();

    try {
      const text = extractVisibleText(document.body);

      if (!text) {
        this.log('No visible text found');
        return this.currentResult;
      }

      if (!containsCryptoKeywords(text)) {
        this.log('No crypto keywords detected (quick check)');
        return this.currentResult;
      }

      this.currentResult = scanForKeywords(text, {
        minCount: 1,
        maxKeywords: this.options.maxKeywords,
        extractSnippets: true
      });
      this.scannedText.add(this.hashText(text));

      this.log(
        `Initial scan complete: ${this.currentResult.uniqueCount} keywords in ${this.currentResult.scanTimeMs.toFixed(
          2
        )}ms`
      );

      this.options.onUpdate(this.currentResult);

      return this.currentResult;
    } finally {
      this.isScanning = false;
      this.log(`Total scan time: ${(performance.now() - startTime).toFixed(2)}ms`);
    }
  }

  /**
   * Starts observing DOM for dynamic content changes.
   */
  startObserving(): void {
    if (this.observer) {
      this.log('Already observing');
      return;
    }

    this.observer = new MutationObserver(mutations => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    this.log('Started observing DOM mutations');
  }

  /**
   * Stops observing DOM changes.
   */
  stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.log('Stopped observing DOM mutations');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Gets the current scan result.
   */
  getResult(): ScanResult {
    return this.currentResult;
  }

  /**
   * Destroys the scanner and cleans up resources.
   */
  destroy(): void {
    this.stopObserving();
    this.pendingElements.clear();
    this.scannedText.clear();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    // Collect affected elements
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.pendingElements.add(node as Element);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            this.pendingElements.add(node.parentElement);
          }
        }
      } else if (mutation.type === 'characterData' && mutation.target.parentElement) {
        this.pendingElements.add(mutation.target.parentElement);
      }
    }

    // Debounce the scan
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingElements();
    }, this.options.debounceMs);
  }

  private processPendingElements(): void {
    if (this.pendingElements.size === 0 || this.isScanning) {
      return;
    }

    this.isScanning = true;

    try {
      const elementsToScan = Array.from(this.pendingElements);
      this.pendingElements.clear();

      const textParts: string[] = [];

      for (const element of elementsToScan) {
        if (!document.body.contains(element)) continue;

        const text = extractTextFromElement(element);
        if (text && text.length > 10) {
          const hash = this.hashText(text);
          if (!this.scannedText.has(hash)) {
            textParts.push(text);
            this.scannedText.add(hash);
          }
        }
      }

      if (textParts.length === 0) {
        this.log('No new text to scan from mutations');
        return;
      }

      const combinedText = textParts.join(' ');

      if (!containsCryptoKeywords(combinedText)) {
        this.log('No crypto keywords in new content (quick check)');
        return;
      }

      const newResult = scanForKeywords(combinedText, {
        minCount: 1,
        maxKeywords: this.options.maxKeywords,
        extractSnippets: true
      });

      if (newResult.uniqueCount > 0) {
        this.currentResult = mergeScanResults(this.currentResult, newResult);
        this.log(`Mutation scan: found ${newResult.uniqueCount} new keywords`);

        this.options.onUpdate(this.currentResult);
      }
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Simple hash function for text deduplication.
   */
  private hashText(text: string): string {
    // Take first 100 and last 100 chars plus length for quick hash
    const key = `${text.length}:${text.slice(0, 100)}:${text.slice(-100)}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private log(message: string): void {
    if (this.options.debug) {
      console.log(`[PageScanner] ${message}`);
    }
  }
}

/**
 * Creates and initializes a page scanner.
 */
export function createPageScanner(options?: PageScannerOptions): PageScanner {
  return new PageScanner(options);
}
