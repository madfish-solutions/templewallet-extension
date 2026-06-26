import browser from 'webextension-polyfill';

import { checkIfAccountExists } from 'content-scripts/utils';
import {
  ADS_VIEWER_DATA_STORAGE_KEY,
  WEB_WIDGETS_SNOOZE_DURATION_MS,
  WEB_WIDGETS_SNOOZE_UNTIL,
  WEB_WIDGETS_TOKEN_INSIGHT_ENABLED
} from 'lib/constants';
import { onStorageChanged } from 'lib/storage';
import type { AdsViewerData } from 'temple/types';

import { objktDetector } from './detectors/objkt/objkt-detector';
import { ScanEngine } from './engine/scan-engine';
import { loadWidgetFonts } from './load-fonts';
import { DetectorRegistry } from './registry';

const toEnabled = (value: unknown): boolean => value === undefined || Boolean(value);

const toSnoozeUntil = (value: unknown): number =>
  typeof value === 'number' && value <= Date.now() + WEB_WIDGETS_SNOOZE_DURATION_MS ? value : 0;

export function bootstrap(): void {
  loadWidgetFonts();

  const registry = new DetectorRegistry();
  registry.register(objktDetector);

  const engine = new ScanEngine(registry);

  let walletExists = false;
  let tokenInsightEnabled = true;
  let snoozeUntil = 0;
  let resumeTimer: NodeJS.Timeout | null = null;

  const syncEngine = () => {
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }

    const now = Date.now();
    const snoozed = snoozeUntil > now;

    if (walletExists && tokenInsightEnabled && !snoozed) {
      engine.start();
    } else {
      engine.stop();
    }

    if (walletExists && tokenInsightEnabled && snoozed) {
      resumeTimer = setTimeout(syncEngine, snoozeUntil - now);
    }
  };

  Promise.all([
    browser.storage.local.get([WEB_WIDGETS_TOKEN_INSIGHT_ENABLED, WEB_WIDGETS_SNOOZE_UNTIL]),
    checkIfAccountExists()
  ]).then(([storage, hasAccount]) => {
    walletExists = hasAccount;
    tokenInsightEnabled = toEnabled(storage[WEB_WIDGETS_TOKEN_INSIGHT_ENABLED]);
    snoozeUntil = toSnoozeUntil(storage[WEB_WIDGETS_SNOOZE_UNTIL]);
    syncEngine();
  });

  onStorageChanged(WEB_WIDGETS_TOKEN_INSIGHT_ENABLED, value => {
    tokenInsightEnabled = toEnabled(value);
    syncEngine();
  });

  onStorageChanged(WEB_WIDGETS_SNOOZE_UNTIL, value => {
    snoozeUntil = toSnoozeUntil(value);
    syncEngine();
  });

  onStorageChanged<AdsViewerData | null>(ADS_VIEWER_DATA_STORAGE_KEY, value => {
    walletExists = Boolean(value?.tezosAddress || value?.evmAddress);
    syncEngine();
  });
}
