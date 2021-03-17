import { useCallback, useMemo, useState } from "react";

import constate from "constate";

import { AlertModalProps } from "app/templates/AlertModal";
import { ConfirmationModalProps } from "app/templates/ConfirmationModal";

type AlertParams = Omit<AlertModalProps, "onRequestClose">;
type ConfirmParams = Omit<
  ConfirmationModalProps,
  "onRequestClose" | "onConfirm"
>;

export type AlertFn = (params: Omit<AlertParams, "isOpen">) => Promise<void>;
export type ConfirmFn = (
  params: Omit<ConfirmParams, "isOpen">
) => Promise<boolean>;

type DummyEventListener = (e: Event) => void;

const ALERT_CLOSE_EVENT_NAME = "alertclosed";
const CONFIRM_CLOSE_EVENT_NAME = "confirmclosed";

class AlertClosedEvent extends CustomEvent<void> {}
class ConfirmClosedEvent extends CustomEvent<boolean> {}

export const [
  DialogsProvider,
  useAlert,
  useConfirm,
  useModalsParams,
] = constate(
  useDialogs,
  (v) => v.alert,
  (v) => v.confirm,
  (v) => v.modalsParams
);

function useDialogs() {
  const [alertParams, setAlertParams] = useState<AlertParams>({
    isOpen: false,
  });
  const [confirmParams, setConfirmParams] = useState<ConfirmParams>({
    isOpen: false,
  });

  const alert = useCallback(async (params: Omit<AlertParams, "isOpen">) => {
    setAlertParams({ ...params, isOpen: true });
    await waitForEvent<AlertClosedEvent>(ALERT_CLOSE_EVENT_NAME);
    setAlertParams({ ...params, isOpen: false });
  }, []);

  const confirm = useCallback(async (params: Omit<ConfirmParams, "isOpen">) => {
    setConfirmParams({ ...params, isOpen: true });
    const result = await waitForEvent<ConfirmClosedEvent>(
      CONFIRM_CLOSE_EVENT_NAME
    );
    setConfirmParams({ ...params, isOpen: false });
    return result;
  }, []);

  const modalsParams = useMemo(
    () => ({
      alertParams,
      confirmParams,
    }),
    [alertParams, confirmParams]
  );

  return {
    alert,
    confirm,
    modalsParams,
  };
}

const rootElement = document.getElementById("root");
function waitForEvent<E extends CustomEvent>(eventName: E["type"]) {
  return new Promise<E["detail"]>((resolve) => {
    const listener = (event: CustomEvent) => {
      rootElement?.removeEventListener(
        eventName,
        listener as DummyEventListener
      );
      resolve(event.detail);
    };
    rootElement?.addEventListener(eventName, listener as DummyEventListener);
  });
}

export function dispatchAlertClose() {
  rootElement?.dispatchEvent(new AlertClosedEvent(ALERT_CLOSE_EVENT_NAME));
}

export function dispatchConfirmClose(value: boolean) {
  rootElement?.dispatchEvent(
    new ConfirmClosedEvent(CONFIRM_CLOSE_EVENT_NAME, { detail: value })
  );
}
