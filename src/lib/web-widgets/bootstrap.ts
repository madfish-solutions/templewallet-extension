import browser from 'webextension-polyfill';

import {
  WEB_WIDGETS_SNOOZE_DURATION_MS,
  WEB_WIDGETS_SNOOZE_UNTIL,
  WEB_WIDGETS_TOKEN_INSIGHT_ENABLED
} from 'lib/constants';

import { objktDetector } from './detectors/objkt/objkt-detector';
import { ScanEngine } from './engine/scan-engine';
import { loadWidgetFonts } from './load-fonts';
import { DetectorRegistry } from './registry';
import { onStorageKey } from './storage';

const toEnabled = (value: unknown): boolean => value === undefined || Boolean(value);

const toSnoozeUntil = (value: unknown): number =>
  typeof value === 'number' && value <= Date.now() + WEB_WIDGETS_SNOOZE_DURATION_MS ? value : 0;

export function bootstrap(): void {
  loadWidgetFonts();

  const registry = new DetectorRegistry();
  registry.register(objktDetector);

  const engine = new ScanEngine(registry);

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

    if (tokenInsightEnabled && !snoozed) {
      engine.start();
    } else {
      engine.stop();
    }

    if (tokenInsightEnabled && snoozed) {
      resumeTimer = setTimeout(syncEngine, snoozeUntil - now);
    }
  };

  browser.storage.local.get([WEB_WIDGETS_TOKEN_INSIGHT_ENABLED, WEB_WIDGETS_SNOOZE_UNTIL]).then(storage => {
    tokenInsightEnabled = toEnabled(storage[WEB_WIDGETS_TOKEN_INSIGHT_ENABLED]);
    snoozeUntil = toSnoozeUntil(storage[WEB_WIDGETS_SNOOZE_UNTIL]);
    syncEngine();
  });

  onStorageKey(WEB_WIDGETS_TOKEN_INSIGHT_ENABLED, value => {
    tokenInsightEnabled = toEnabled(value);
    syncEngine();
  });

  onStorageKey(WEB_WIDGETS_SNOOZE_UNTIL, value => {
    snoozeUntil = toSnoozeUntil(value);
    syncEngine();
  });
}
