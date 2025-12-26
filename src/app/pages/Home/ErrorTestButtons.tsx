import React, { memo, Suspense, useState } from 'react';

import { useRetryableSWR } from 'lib/swr';

/**
 * Test component to trigger different types of errors for testing reportError function
 * This should be removed after testing
 */
const ThrowingComponent = () => {
  throw new Error('Test React Error - ErrorBoundary');
};

const SwrErrorComponent = () => {
  useRetryableSWR(
    'test-swr-suspense-error',
    async () => {
      throw new Error('Test SWR Suspense Error');
    },
    { suspense: true, shouldRetryOnError: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  return null;
};

export const ErrorTestButtons = memo(() => {
  const [shouldThrowReactError, setShouldThrowReactError] = useState(false);
  const [shouldThrowSwrError, setShouldThrowSwrError] = useState(false);

  const throwJavaScriptError = () => {
    throw new Error('Test JavaScript Error - window.onerror');
  };

  const throwReactError = () => {
    setShouldThrowReactError(true);
  };

  const throwUnhandledRejection = () => {
    Promise.reject(new Error('Test Unhandled Promise Rejection'));
  };

  if (shouldThrowReactError) {
    return <ThrowingComponent />;
  }

  if (shouldThrowSwrError) {
    return (
      <Suspense fallback={null}>
        <SwrErrorComponent />
      </Suspense>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg shadow-lg">
      <div className="text-xs font-bold text-yellow-800 mb-2">Error Testing (Remove after testing)</div>
      <button
        onClick={throwJavaScriptError}
        className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
      >
        Test window.onerror
      </button>
      <button
        onClick={throwReactError}
        className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
      >
        Test ErrorBoundary
      </button>
      <button
        onClick={throwUnhandledRejection}
        className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
      >
        Test Promise Rejection
      </button>
      <button
        onClick={() => setShouldThrowSwrError(true)}
        className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        Test SWR (suspense) Error
      </button>
    </div>
  );
});
