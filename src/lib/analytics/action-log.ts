import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

import { sanitizeValue } from './sanitize.utils';

const MAX_ACTIONS = 10;

export interface ActionLogEntry {
  event: string;
  category: AnalyticsEventCategory | string;
  timestamp: number;
  properties?: Record<string, unknown>;
}

const actionLog: ActionLogEntry[] = [];

export function recordAction(entry: ActionLogEntry) {
  if (
    entry.category === AnalyticsEventCategory.Error ||
    entry.event === 'ErrorCaptured' ||
    entry.event === 'STORAGES_STATE'
  ) {
    return;
  }

  const sanitizedEntry: ActionLogEntry = {
    ...entry,
    properties: entry.properties ? sanitizeValue(entry.properties) : undefined
  };

  actionLog.push(sanitizedEntry);

  if (actionLog.length > MAX_ACTIONS) {
    actionLog.splice(0, actionLog.length - MAX_ACTIONS);
  }
}

export function getActionLog(): ActionLogEntry[] {
  return [...actionLog];
}
