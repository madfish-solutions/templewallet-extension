import { useEffect, useRef } from 'react';

import tippy, { Props, Instance } from 'tippy.js';

export type UseTippyOptions = Partial<Props>;

export default function useTippy<T extends Element>(props: UseTippyOptions) {
  const targetRef = useRef<T>(null);
  const instanceRef = useRef<Instance>();

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
