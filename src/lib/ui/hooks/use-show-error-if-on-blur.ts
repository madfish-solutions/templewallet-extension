import { useCallback, useState } from 'react';

import { useFocusHandlers } from './use-focus-handlers';

export const useShowErrorIfOnBlur = () => {
  const [value, setValue] = useState(false);

  const handleBlur = useCallback(() => setValue(true), []);

  const { isFocused, onFocus, onBlur } = useFocusHandlers(undefined, handleBlur);

  const onChange = useCallback(() => {
    if (isFocused) {
      setValue(false);
    }
  }, [isFocused]);

  return { showErrorIfOnBlur: value, onFocus, onBlur, onChange };
};
