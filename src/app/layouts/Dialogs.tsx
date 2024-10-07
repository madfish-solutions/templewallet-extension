import React, { FC, useCallback } from 'react';

import { AlertModal } from 'app/templates/AlertModal';
import { ConfirmationModal } from 'app/templates/ConfirmationModal/ConfirmationModal';
import { dispatchAlertClose, dispatchConfirmClose, useModalsParams } from 'lib/ui/dialog';

const Dialogs: FC = () => {
  const { alertParams, confirmParams } = useModalsParams();

  const handleConfirmationModalClose = useCallback(() => {
    dispatchConfirmClose(false);
  }, []);

  const handleConfirmation = useCallback(() => {
    dispatchConfirmClose(true);
  }, []);

  return (
    <>
      <ConfirmationModal {...confirmParams} onClose={handleConfirmationModalClose} onConfirm={handleConfirmation} />
      <AlertModal {...alertParams} onClose={dispatchAlertClose} />
    </>
  );
};

export default Dialogs;
