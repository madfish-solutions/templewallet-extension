import * as React from "react";
import useIsMounted from "lib/ui/useIsMounted";

export default function useSafeState<T>(
  initialState: T | (() => T),
  dep?: any
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const isMounted = useIsMounted();
  const [state, setStatePure] = React.useState(initialState);

  const setState = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (val) => {
      if (isMounted()) {
        setStatePure(val);
      }
    },
    [isMounted, setStatePure]
  );

  const depRef = React.useRef(dep);
  React.useEffect(() => {
    if (depRef.current !== dep) {
      setState(initialState);
    }
    depRef.current = dep;
  }, [dep, setState, initialState]);

  return [state, setState];
}
