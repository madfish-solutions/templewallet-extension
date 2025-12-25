import { APP_VERSION, IS_DEV_ENV } from 'lib/env';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

import { sendTrackEvent } from './send-events.utils';

const MAX_ACTION_LOG_SIZE = 50;

interface ActionLogEntry {
  action: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

let actionLog: ActionLogEntry[] = [];

export function logAction(action: string, details?: Record<string, unknown>): void {
  actionLog.push({ action, timestamp: Date.now(), details });

  if (actionLog.length > MAX_ACTION_LOG_SIZE) {
    actionLog = actionLog.slice(-MAX_ACTION_LOG_SIZE);
  }
}

export function getActionLog(): ActionLogEntry[] {
  return [...actionLog];
}

function getOSInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return navigator.platform || 'Unknown';
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Brave')) return 'Brave';
  if (ua.includes('Chrome/')) return 'Chrome';
  return 'Unknown';
}

export async function reportError(
  error: Error,
  userId: string,
  chainId: string | undefined,
  isAnalyticsEnabled: boolean,
  customContext?: Record<string, unknown>
): Promise<void> {
  if (!isAnalyticsEnabled || IS_DEV_ENV) return;

  try {
    await sendTrackEvent(userId, chainId, 'ErrorCaptured', AnalyticsEventCategory.Error, {
      errorType: error.name || 'Error',
      errorMessage: error.message,
      stackTrace: error.stack,
      version: APP_VERSION,
      os: getOSInfo(),
      browser: getBrowserInfo(),
      timestamp: Date.now(),
      url: window.location.href,
      actionLog: getActionLog(),
      ...customContext
    });
  } catch {
    // error
  }
}

export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  return new Error(String(value));
}
