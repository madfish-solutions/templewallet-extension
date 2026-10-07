import { FC, useEffect } from 'react';

export function createHookWrapper<Props extends object, Result>(
  useHook: (props: Props) => Result,
  onResult: (result: Result) => void
): FC<Props> {
  const Wrapper: FC<Props> = props => {
    const result = useHook(props);

    useEffect(() => {
      onResult(result);
    }, [result]);

    return null;
  };

  return Wrapper;
}
