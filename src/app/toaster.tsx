import React, { memo, useEffect, useMemo, useRef } from 'react';

import clsx from 'clsx';
import toast, { Toaster, Toast, ToastIcon, ToastType } from 'react-hot-toast';

import HashShortView from 'app/atoms/HashShortView';
import { useAppEnv } from 'app/env';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { ReactComponent as InfoIcon } from 'app/icons/typed-msg/info.svg';
import { ReactComponent as SuccessIcon } from 'app/icons/typed-msg/success.svg';
import { ReactComponent as WarningIcon } from 'app/icons/typed-msg/warning.svg';
import { useToastsContainerBottomShift } from 'lib/temple/front/toasts-context';
import PortalToDocumentBody from 'lib/ui/Portal';

interface TxData {
  hash: string;
  blockExplorerHref: string;
}

const MAX_TOASTS_COUNT = 3;
const toastsIdsPool: string[] = [];
const toastsHashesPool: (string | undefined)[] = [];

const withToastsLimit =
  <A extends unknown[] = [title: string, textBold?: boolean]>(
    toastFn: (...args: A) => string,
    toastHashFn: (...args: A) => string | undefined = () => undefined
  ) =>
  (...args: A) => {
    if (toastsIdsPool.length >= MAX_TOASTS_COUNT) {
      const toastsToDismissCount = toastsIdsPool.length - MAX_TOASTS_COUNT + 1;
      const toastsIdsToDismiss = toastsIdsPool.splice(0, toastsToDismissCount);
      toastsHashesPool.splice(0, toastsToDismissCount);
      toastsIdsToDismiss.forEach(id => toast.remove(id));
    }
    const newToastId = toastFn(...args);
    toastsIdsPool.push(newToastId);
    toastsHashesPool.push(toastHashFn(...args));
  };

const withUniqCheck =
  <A extends unknown[] = [title: string, textBold?: boolean]>(
    toastFn: (...args: A) => void,
    toastHashFn: (...args: A) => string
  ) =>
  (...args: A) => {
    if (!toastsHashesPool.includes(toastHashFn(...args))) {
      toastFn(...args);
    }
  };

export const toastSuccess = withToastsLimit((title: string, textBold?: boolean, txData?: TxData) =>
  toast.custom(toast => (
    <CustomToastBar toast={{ ...toast, message: title }} customType="success" textBold={textBold} txData={txData} />
  ))
);

export const toastError = withToastsLimit((title, textBold?, txData?: TxData) =>
  toast.custom(toast => (
    <CustomToastBar toast={{ ...toast, message: title }} customType="error" textBold={textBold} txData={txData} />
  ))
);

export const toastInfo = withToastsLimit((title, textBold?, link?: ReactChildren) =>
  toast.custom(toast => (
    <CustomToastBar toast={{ ...toast, message: title }} customType="blank" textBold={textBold} link={link} />
  ))
);

const getWarningToastHash = (title: string, textBold = true) => `${title}_${textBold}`;

export const toastWarning = withToastsLimit(
  (title, textBold?) =>
    toast.custom(toast => (
      <CustomToastBar toast={{ ...toast, message: title }} customType="warning" textBold={textBold} />
    )),
  getWarningToastHash
);

export const toastUniqWarning = withUniqCheck(toastWarning, getWarningToastHash);

export const ToasterProvider = memo(() => {
  const [bottomShift] = useToastsContainerBottomShift();

  const { fullPage, confirmWindow } = useAppEnv();

  const toastsContainerStyle = useMemo(
    () => ({ bottom: (fullPage ? (confirmWindow ? 32 : 64) : 32) + bottomShift }),
    [bottomShift, confirmWindow, fullPage]
  );

  return (
    <PortalToDocumentBody>
      <Toaster position="bottom-center" containerStyle={toastsContainerStyle}>
        {t => <CustomToastBar toast={t} />}
      </Toaster>
    </PortalToDocumentBody>
  );
});

type ToastTypeExtended = ToastType | 'warning';

const TOAST_CLASSES: Partial<Record<ToastTypeExtended, string>> = {
  success: 'bg-success-low',
  error: 'bg-error-low',
  blank: 'bg-secondary-low',
  warning: 'bg-warning-low'
};

interface CustomToastBarProps {
  toast: Toast;
  customType?: ToastTypeExtended;
  textBold?: boolean;
  txData?: TxData;
  link?: ReactChildren;
}

const CustomToastBar = memo<CustomToastBarProps>(({ toast, customType, textBold = true, txData, link }) => {
  const type: ToastTypeExtended = customType || toast.type;

  const prevToastVisibleRef = useRef(toast.visible);
  useEffect(() => {
    if (prevToastVisibleRef.current && !toast.visible) {
      const toastIndex = toastsIdsPool.indexOf(toast.id);
      if (toastIndex !== -1) {
        toastsIdsPool.splice(toastIndex, 1);
        toastsHashesPool.splice(toastIndex, 1);
      }
    }
    prevToastVisibleRef.current = toast.visible;
  }, [toast.id, toast.visible]);

  return (
    <div
      className={clsx(
        'px-3 py-2.5 flex gap-x-1 rounded-md shadow-bottom max-w-88',
        toast.visible ? 'animate-toast-enter' : 'animate-toast-leave',
        TOAST_CLASSES[type]
      )}
    >
      <CustomToastIcon toast={toast} type={type} />

      {typeof toast.message === 'function' ? (
        toast.message(toast)
      ) : (
        <span className={clsx('self-center', textBold ? 'text-font-description-bold' : 'text-font-description')}>
          {toast.message}
        </span>
      )}

      {txData ? (
        <a
          href={txData.blockExplorerHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row items-center text-font-num-bold-12 text-secondary ml-12"
        >
          <HashShortView hash={txData.hash} />
          <OutLinkIcon className="h-4 stroke-current fill-current" />
        </a>
      ) : (
        link
      )}
    </div>
  );
});

const customIcons = {
  success: SuccessIcon,
  error: ErrorIcon,
  blank: InfoIcon,
  warning: WarningIcon
};

const CustomToastIcon = memo<{ toast: Toast; type: ToastTypeExtended }>(({ toast, type }) => {
  switch (type) {
    case 'loading':
      return <ToastIcon toast={toast} />;
    case 'success':
    case 'warning':
    case 'error':
    case 'blank':
      const Icon = customIcons[type];

      return <Icon className="size-6 min-w-6" />;
    default:
      return null;
  }
});
