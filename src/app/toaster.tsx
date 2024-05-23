import React, { memo, useMemo } from 'react';

import clsx from 'clsx';
import toast, { Toaster, Toast, ToastIcon, ToastType } from 'react-hot-toast';

import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { ReactComponent as InfoIcon } from 'app/icons/typed-msg/info.svg';
import { ReactComponent as SuccessIcon } from 'app/icons/typed-msg/success.svg';
import { ReactComponent as WarningIcon } from 'app/icons/typed-msg/warning.svg';
import { useToastsContainerBottomShiftSelector } from 'app/store/toasts-container-shift/selectors';
import PortalToDocumentBody from 'lib/ui/Portal';

export const toastSuccess = (title: string) => void toast.success(title);
// @ts-prune-ignore-next
export const toastError = (title: string) => void toast.error(title);
// @ts-prune-ignore-next
export const toastInfo = (title: string) => void toast(title);
// @ts-prune-ignore-next
export const toastWarning = (title: string) =>
  void toast.custom(toast => <CustomToastBar toast={{ ...toast, message: title }} customType="warning" />);

export const ToasterProvider = memo(() => {
  const bottomShift = useToastsContainerBottomShiftSelector();
  const toastsContainerStyle = useMemo(() => ({ bottom: 64 + bottomShift }), [bottomShift]);

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

const CustomToastBar = memo<{ toast: Toast; customType?: ToastTypeExtended }>(({ toast, customType }) => {
  const type: ToastTypeExtended = customType || toast.type;

  return (
    <div className={clsx('px-3 py-2.5 flex gap-x-1 items-center rounded-md shadow-bottom', TOAST_CLASSES[type])}>
      <CustomToastIcon toast={toast} type={type} />

      {typeof toast.message === 'function' ? (
        toast.message(toast)
      ) : (
        <span className="text-font-description-bold">{toast.message}</span>
      )}
    </div>
  );
});

const CustomToastIcon = memo<{ toast: Toast; type: ToastTypeExtended }>(({ toast, type }) => {
  switch (type) {
    case 'success':
      return <SuccessIcon className="w-6 h-6" />;
    case 'warning':
      return <WarningIcon className="w-6 h-6" />;
    case 'error':
      return <ErrorIcon className="w-6 h-6" />;
    case 'loading':
      return <ToastIcon toast={toast} />;
    case 'blank':
      return <InfoIcon className="w-6 h-6" />;
  }

  return null;
});
