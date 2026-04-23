import { useEffect, useState } from 'react';

import { PageLoader } from 'app/atoms/Loader';

import { HomeContent } from './HomeContent';

const INITIAL_DELAY = 1_000;

let shouldShowInitialLoader = true;

export const Home = () => {
  const [loaderVisible, setLoaderVisible] = useState(shouldShowInitialLoader);

  useEffect(() => {
    if (!shouldShowInitialLoader) return;

    shouldShowInitialLoader = false;

    const timeoutId = setTimeout(() => {
      setLoaderVisible(false);
    }, INITIAL_DELAY);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <HomeContent />

      {loaderVisible && (
        <div className="fixed inset-0 z-overlay-loading flex items-center justify-center bg-document">
          <PageLoader />
        </div>
      )}
    </>
  );
};
