import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { noop, throttle } from 'lodash';

export const useElementValueWithEvents = <T extends HTMLElement, V>(
  ref: RefObject<T>,
  valueFn: (element: T) => V,
  initialValue: V,
  eventsNames: string[],
  throttleTime?: number,
  onUpdate: (value: V) => void = noop
) => {
  const prevValueRef = useRef(initialValue);
  const [value, setValue] = useState(initialValue);

  const updateValue = useMemo(() => {
    const updateValueBase = () => {
      if (!ref.current) {
        return;
      }

      const newValue = valueFn(ref.current);

      if (newValue !== prevValueRef.current) {
        prevValueRef.current = newValue;
        onUpdate(newValue);
        setValue(newValue);
      }
    };

    return typeof throttleTime === 'number' ? throttle(updateValueBase, throttleTime) : updateValueBase;
  }, [onUpdate, ref, throttleTime, valueFn]);

  useEffect(() => {
    updateValue();

    const element = ref.current;
    if (element) {
      eventsNames.forEach(eventName => element.addEventListener(eventName, updateValue));

      return () => eventsNames.forEach(eventName => element.removeEventListener(eventName, updateValue));
    }

    return undefined;
  }, [eventsNames, ref, updateValue]);

  return { value, updateValue };
};
