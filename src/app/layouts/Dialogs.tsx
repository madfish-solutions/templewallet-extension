import React, { useCallback } from "react";
import {
  dispatchAlertClose,
  dispatchConfirmClose,
  useModalsParams,
} from "lib/ui/dialog";
import ConfirmationModal from "app/templates/ConfirmationModal";
import AlertModal from "app/templates/AlertModal";

const Dialogs: React.FC = () => {
  const { alertParams, confirmParams } = useModalsParams();

  const handleConfirmationModalClose = useCallback(() => {
    dispatchConfirmClose(false);
  }, []);

  const handleConfirmation = useCallback(() => {
    dispatchConfirmClose(true);
  }, []);

  return (
    <>
      <ConfirmationModal
        {...confirmParams}
        onRequestClose={handleConfirmationModalClose}
        onConfirm={handleConfirmation}
      />
      <AlertModal {...alertParams} onRequestClose={dispatchAlertClose} />
    </>
  );
};

export default Dialogs;
