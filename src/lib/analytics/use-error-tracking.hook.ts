import { useEffect, useRef } from 'react';

import { useAnalyticsEnabledSelector, useUserIdSelector } from 'app/store/settings/selectors';

import { reportError, toError } from './error-tracking';

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

  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      'error',
      (event: ErrorEvent) => {
        const error = event.error || new Error(event.message);
        void reportError(error, userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
          source: 'window.onerror',
          filename: event.filename,
          lineno: event.lineno
        });
      },
      {
        signal: controller.signal
      }
    );

    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        void reportError(toError(event.reason), userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
          source: 'unhandledrejection'
        });
      },
      {
        signal: controller.signal
      }
    );

    const handleTempleError = (event: Event) => {
      const detail = (event as CustomEvent<{ error: Error; componentStack?: string }>).detail;
      if (!detail?.error) return;
      void reportError(detail.error, userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
        source: 'ErrorBoundary',
        componentStack: detail.componentStack
      });
    };

    window.addEventListener('temple-error', handleTempleError, { signal: controller.signal });
    return () => void controller.abort();
  }, []);
}
