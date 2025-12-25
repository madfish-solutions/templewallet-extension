import { APP_VERSION, IS_DEV_ENV } from 'lib/env';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';

import { sendTrackEvent } from './send-events.utils';

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return navigator.platform || 'Unknown';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  const chrome = ua.match(/Chrome\/(\d+\.\d+)/);
  if (chrome) return `Chrome ${chrome[1]}`;
  const firefox = ua.match(/Firefox\/(\d+\.\d+)/);
  if (firefox) return `Firefox ${firefox[1]}`;
  const edge = ua.match(/Edg\/(\d+\.\d+)/);
  if (edge) return `Edge ${edge[1]}`;
  if (ua.includes('Brave')) {
    const brave = ua.match(/Chrome\/(\d+\.\d+)/);
    return brave ? `Brave ${brave[1]}` : 'Brave';
  }
  return 'Unknown';
}

function getWindowType(): string {
  const url = window.location.href;
  if (url.includes('popup.html')) return 'popup';
  if (url.includes('fullpage.html')) return 'fullpage';
  if (url.includes('sidebar.html')) return 'sidebar';
  if (url.includes('confirm.html')) return 'confirm';
  if (url.includes('options.html')) return 'options';
  return 'unknown';
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
    const now = new Date();

    await sendTrackEvent(userId, chainId, 'ErrorCaptured', AnalyticsEventCategory.Error, {
      errorType: error.name || 'Error',
      errorMessage: error.message,
      stackTrace: error.stack,
      version: APP_VERSION,
      windowType: getWindowType(),
      url: window.location.href,
      os: getOS(),
      browser: getBrowser(),
      timestamp: now.getTime(),
      timestampISO: now.toISOString(),
      chainId: chainId || null,
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
