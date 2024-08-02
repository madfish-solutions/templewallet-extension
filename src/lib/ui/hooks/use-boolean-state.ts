import { useCallback, useState } from 'react';

type BooleanStateValues = [
  value: boolean,
  setTrueValue: EmptyFn,
  setFalseValue: EmptyFn,
  toggleValue: EmptyFn,
  setValue: SyncFn<boolean>
];

export const useBooleanState = (init: boolean): BooleanStateValues => {
  const [value, setValue] = useState(init);

  const toggleValue = useCallback(() => void setValue(val => !val), []);
  const setTrueValue = useCallback(() => void setValue(true), []);
  const setFalseValue = useCallback(() => void setValue(false), []);

  return [value, setTrueValue, setFalseValue, toggleValue, setValue];
};
