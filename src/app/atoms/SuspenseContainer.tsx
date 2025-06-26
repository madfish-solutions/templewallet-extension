import React, { FC, ReactNode, Suspense } from 'react';

import ErrorBoundary from 'app/ErrorBoundary';

import { PageLoader } from './Loader';

interface Props extends PropsWithChildren {
  /** Default message on error */
  errorMessage?: string;
  loader?: ReactNode;
}

/** Boundary for components' errors & suspense behaviour */
export const SuspenseContainer: FC<Props> = ({ errorMessage, loader = <PageLoader stretch />, children }) => (
  <ErrorBoundary whileMessage={errorMessage}>
    <Suspense fallback={loader}>{children}</Suspense>
  </ErrorBoundary>
);
