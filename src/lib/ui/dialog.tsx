import constate from "constate";
import { AlertModalProps } from "app/templates/AlertModal";
import { ConfirmationModalProps } from "app/templates/ConfirmationModal";
import { useCallback, useMemo, useState } from "react";

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

type AlertParams = Omit<AlertModalProps, "onRequestClose" | "isOpen">;
type ConfirmParams = Omit<
  ConfirmationModalProps,
  "onRequestClose" | "onConfirm" | "isOpen"
>;
export type AlertFn = (params: AlertParams) => Promise<void>;
export type ConfirmFn = (params: ConfirmParams) => Promise<boolean>;
const ALERT_CLOSE_EVENT_NAME = "alertclosed";
const CONFIRM_CLOSE_EVENT_NAME = "confirmclosed";

type DummyEventListener = (e: Event) => void;

class AlertClosedEvent extends CustomEvent<void> {}

class ConfirmClosedEvent extends CustomEvent<boolean> {}

function useDialogs() {
  const [alertParams, setAlertParams] = useState<AlertParams>();
  const [confirmParams, setConfirmParams] = useState<ConfirmParams>();

  const alert = useCallback(async (params: AlertParams) => {
    setAlertParams(params);
    await waitForEvent<AlertClosedEvent>(ALERT_CLOSE_EVENT_NAME);
    setAlertParams(undefined);
  }, []);

  const confirm = useCallback(async (params: ConfirmParams) => {
    setConfirmParams(params);
    const result = await waitForEvent<ConfirmClosedEvent>(
      CONFIRM_CLOSE_EVENT_NAME
    );
    setConfirmParams(undefined);
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
