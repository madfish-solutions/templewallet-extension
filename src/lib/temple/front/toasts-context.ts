import { useState } from 'react';

import constate from 'constate';

export const [ToastsContextProvider, useInitToastMessage, useToastsContainerBottomShift] = constate(
  useToastsContext,
  v => v.initToastMessage,
  v => v.toastsContainerBottomShift
);

function useToastsContext() {
  const initToastMessage = useState<string | undefined>();
  const toastsContainerBottomShift = useState(0);

  return {
    initToastMessage,
    toastsContainerBottomShift
  };
}
