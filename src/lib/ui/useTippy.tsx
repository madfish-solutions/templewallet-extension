import { useEffect, useRef } from 'react';

import tippy, { Props, Instance } from 'tippy.js';

export type TippyInstance = Instance<Props>;

export type UseTippyOptions = Partial<Props>;

export default function useTippy<T extends HTMLElement>(props: UseTippyOptions) {
  const targetRef = useRef<T>(null);
  const instanceRef = useRef<Instance<Props>>();

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setProps(props);
    } else if (targetRef.current) {
      instanceRef.current = tippy(targetRef.current, props);
    }
  }, [props]);

  useEffect(
    () => () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    },
    []
  );

  return targetRef;
}
