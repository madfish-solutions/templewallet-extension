import { useCallback, useState } from 'react';

export const useBooleanState = (init: boolean) => {
  const [value, setValue] = useState(init);

  const toggleValue = useCallback(() => void setValue(val => !val), []);
  const setTrueValue = useCallback(() => void setValue(true), []);
  const setFalseValue = useCallback(() => void setValue(false), []);

  return [value, setTrueValue, setFalseValue, toggleValue, setValue] as [
    value: boolean,
    setTrueValue: EmptyFn,
    setFalseValue: EmptyFn,
    toggleValue: EmptyFn,
    setValue: SyncFn<boolean>
  ];
};
