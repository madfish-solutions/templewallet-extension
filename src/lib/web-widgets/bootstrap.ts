import browser from 'webextension-polyfill';

import { WEB_WIDGETS_TOKEN_INSIGHT_ENABLED } from 'lib/constants';

import { objktDetector } from './detectors/objkt/objkt-detector';
import { ScanEngine } from './engine/scan-engine';
import { DetectorRegistry } from './registry';

export function bootstrap(): void {
  const registry = new DetectorRegistry();
  registry.register(objktDetector);

  const engine = new ScanEngine(registry);

  // Token insight is ON by default
  const isEnabled = (value: unknown): boolean => (value === undefined ? true : Boolean(value));

  const apply = (enabled: boolean) => {
    if (enabled) {
      engine.start();
    } else {
      engine.stop();
    }
  };

  browser.storage.local
    .get(WEB_WIDGETS_TOKEN_INSIGHT_ENABLED)
    .then(storage => apply(isEnabled(storage[WEB_WIDGETS_TOKEN_INSIGHT_ENABLED])));

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const change = changes[WEB_WIDGETS_TOKEN_INSIGHT_ENABLED];
    if (!change) return;
    apply(isEnabled(change.newValue));
  });
}
