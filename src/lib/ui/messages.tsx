import constate from "constate";
import AlertModal, { AlertModalProps } from "app/templates/AlertModal";
import ConfirmationModal, {
  ConfirmationModalProps,
} from "app/templates/ConfirmationModal";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const [MessagesProvider, useAlert, useConfirm] = constate(
  useMessages,
  (v) => v.alert,
  (v) => v.confirm
);

export type AlertFn = (params: AlertParams) => Promise<void>;
export type ConfirmFn = (params: ConfirmParams) => Promise<boolean>;
const ALERT_CLOSE_EVENT_NAME = "alertclosed";
const CONFIRM_CLOSE_EVENT_NAME = "confirmclosed";

type DummyEventListener = (e: Event) => void;

class AlertClosedEvent extends CustomEvent<void> {}

class ConfirmClosedEvent extends CustomEvent<boolean> {}

function useMessages() {
  const { makeAlert, makeConfirm } = useContext(MessageContext);

  const alert = useCallback(
    (params: AlertParams) => {
      makeAlert(params);
      return waitForEvent<AlertClosedEvent>(ALERT_CLOSE_EVENT_NAME);
    },
    [makeAlert]
  );

  const confirm = useCallback(
    (params: ConfirmParams) => {
      makeConfirm(params);
      return waitForEvent<ConfirmClosedEvent>(CONFIRM_CLOSE_EVENT_NAME);
    },
    [makeConfirm]
  );

  return {
    alert,
    confirm,
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

type AlertParams = Omit<AlertModalProps, "onRequestClose" | "isOpen">;
type ConfirmParams = Omit<
  ConfirmationModalProps,
  "onRequestClose" | "onConfirm" | "isOpen"
>;

type MessagesContextValue = {
  makeAlert: (params: AlertParams) => void;
  makeConfirm: (params: ConfirmParams) => void;
};

const MessageContext = createContext<MessagesContextValue>({
  makeAlert: () => {},
  makeConfirm: () => {},
});

export const MessageContextProvider: React.FC<{}> = (props) => {
  const { children } = props;
  const [alertParams, setAlertParams] = useState<AlertParams>();
  const [confirmParams, setConfirmParams] = useState<ConfirmParams>();

  const value = useMemo(
    () => ({
      makeAlert: setAlertParams,
      makeConfirm: setConfirmParams,
    }),
    []
  );

  const handleConfirmationModalClose = useCallback(() => {
    setConfirmParams(undefined);
    rootElement?.dispatchEvent(
      new ConfirmClosedEvent(CONFIRM_CLOSE_EVENT_NAME, { detail: false })
    );
  }, []);

  const handleConfirmation = useCallback(() => {
    setConfirmParams(undefined);
    rootElement?.dispatchEvent(
      new ConfirmClosedEvent(CONFIRM_CLOSE_EVENT_NAME, { detail: true })
    );
  }, []);

  const handleAlertClose = useCallback(() => {
    setAlertParams(undefined);
    rootElement?.dispatchEvent(new AlertClosedEvent(ALERT_CLOSE_EVENT_NAME));
  }, []);

  return (
    <MessageContext.Provider value={value}>
      <ConfirmationModal
        {...confirmParams}
        isOpen={!!confirmParams}
        onRequestClose={handleConfirmationModalClose}
        onConfirm={handleConfirmation}
      />
      <AlertModal
        {...alertParams}
        isOpen={!!alertParams}
        onRequestClose={handleAlertClose}
      />
      {children}
    </MessageContext.Provider>
  );
};
