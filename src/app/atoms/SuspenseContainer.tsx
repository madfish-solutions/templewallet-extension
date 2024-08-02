import React, { FC, ReactNode, Suspense } from 'react';

import ErrorBoundary from 'app/ErrorBoundary';

import Spinner from './Spinner/Spinner';

interface Props extends PropsWithChildren {
  /** Default message on error */
  errorMessage?: string;
  loader?: ReactNode;
}

/** Boundary for components' errors & suspense behaviour */
export const SuspenseContainer: FC<Props> = ({ errorMessage, loader = <SpinnerSection />, children }) => (
  <ErrorBoundary whileMessage={errorMessage}>
    <Suspense fallback={loader}>{children}</Suspense>
  </ErrorBoundary>
);

const SpinnerSection = () => (
  <div className="flex justify-center my-12">
    <Spinner theme="gray" className="w-20" />
  </div>
);
