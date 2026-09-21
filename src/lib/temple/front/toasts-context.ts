import { useState } from 'react';

import constate from 'constate';

import { ToastTxData } from 'app/toaster';

interface ToastParams {
  title: string;
  textBold?: boolean | undefined;
  txDataOrLink?: ReactChildren | ToastTxData;
}

export const [ToastsContextProvider, useInitToastParams, useToastsContainerBottomShift] = constate(
  useToastsContext,
  v => v.initToastParams,
  v => v.toastsContainerBottomShift
);

function useToastsContext() {
  const initToastParams = useState<ToastParams | undefined>();
  const toastsContainerBottomShift = useState(0);

  return {
    initToastParams,
    toastsContainerBottomShift
  };
}
