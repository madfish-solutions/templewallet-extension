import { DependencyList, useEffect } from 'react';

import { EmptyFn } from 'app/config/general';

// import { useIsAuthorisedSelector } from '../store/wallet/wallet-selectors';

export const useTimerEffect = (callback: EmptyFn, refreshInterval: number, deps: DependencyList = []) =>
  useEffect(() => {
    callback();

    const interval = setInterval(callback, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

// export const useAuthorisedTimerEffect = (callback: EmptyFn, refreshInterval: number, deps: DependencyList = []) => {
//   const isAuthorised = useIsAuthorisedSelector();

//   useEffect(() => {
//     if (isAuthorised) {
//       callback();

//       const interval = setInterval(callback, refreshInterval);

//       return () => clearInterval(interval);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isAuthorised, ...deps]);
// };
