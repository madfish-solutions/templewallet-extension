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
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      void reportError(error, userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      void reportError(toError(event.reason), userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
        source: 'unhandledrejection'
      });
    };

    const handleReactError = (event: CustomEvent<{ error: Error; componentStack?: string }>) => {
      void reportError(event.detail.error, userIdRef.current, chainIdRef.current, analyticsEnabledRef.current, {
        source: 'ErrorBoundary',
        componentStack: event.detail.componentStack
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('temple-error', handleReactError as EventListener);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('temple-error', handleReactError as EventListener);
    };
  }, []);
}
