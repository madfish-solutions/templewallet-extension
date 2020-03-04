import * as React from "react";
import tippy, { Props, Instance } from "tippy.js";

export default function useTippy<T extends HTMLElement>(props: Partial<Props>) {
  const targetRef = React.useRef<T>(null);
  const instanceRef = React.useRef<Instance<Props>>();

  React.useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setProps(props);
    } else if (targetRef.current) {
      instanceRef.current = tippy(targetRef.current, props);
    }
  }, [props]);

  React.useEffect(
    () => () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    },
    []
  );

  return targetRef;
}
