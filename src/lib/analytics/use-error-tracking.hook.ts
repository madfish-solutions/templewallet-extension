import { useCallback, useEffect, useRef } from 'react';

import { useAnalyticsEnabledSelector, useUserIdSelector } from 'app/store/settings/selectors';

import { logAction, reportError, toError } from './error-tracking';

export function useErrorTracking(chainId?: string) {
  const analyticsEnabled = useAnalyticsEnabledSelector();
  const userId = useUserIdSelector();

  const analyticsEnabledRef = useRef(analyticsEnabled);
  const userIdRef = useRef(userId);
  const chainIdRef = useRef(chainId);

  useEffect(() => {
    analyticsEnabledRef.current = analyticsEnabled;
  }, [analyticsEnabled]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  const captureError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    reportError(toError(error), userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, context);
  }, []);

  const trackAction = useCallback((action: string, details?: Record<string, unknown>) => {
    logAction(action, details);
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      reportError(error, userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(toError(event.reason), userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
        source: 'unhandledrejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return { captureError, trackAction };
}
