import { useCallback } from 'react';

import { useLocationSearchParamValue } from './use-location';

export const useSearchParamsBoolean = (paramName: string) => {
  const [rawValue, setRawValue] = useLocationSearchParamValue(paramName);
  const setValue = useCallback((newState: boolean) => setRawValue(newState ? 'true' : null), [setRawValue]);
  const setTrue = useCallback(() => setValue(true), [setValue]);
  const setFalse = useCallback(() => setValue(false), [setValue]);

  return { value: rawValue === 'true', setTrue, setFalse };
};

export const readSearchParamsBoolean = (paramName: string) =>
  new URLSearchParams(window.location.search).get(paramName) === 'true';
