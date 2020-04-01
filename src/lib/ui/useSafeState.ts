import * as React from "react";
import useIsMounted from "lib/ui/useIsMounted";

export default function useSafeState<T>(
  initialState: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const isMounted = useIsMounted();
  const [state, setStatePure] = React.useState(initialState);

  const setState = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    val => {
      if (isMounted()) {
        setStatePure(val);
      }
    },
    [isMounted, setStatePure]
  );

  return [state, setState];
}
