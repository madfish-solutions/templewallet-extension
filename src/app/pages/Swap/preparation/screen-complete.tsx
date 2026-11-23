import { createContext, useContext, useEffect } from 'react';

import { noop } from 'lodash';

export const SwapScreenCompleteContext = createContext<EmptyFn>(noop);

export const useReportScreenComplete = (complete: boolean) => {
  const report = useContext(SwapScreenCompleteContext);

  useEffect(() => {
    if (complete) report();
  }, [complete, report]);
};
