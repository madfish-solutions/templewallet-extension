import React from "react";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import ModalWithTitle, { ModalWithTitleProps } from "./ModalWithTitle";

export type ConfirmationModalProps = ModalWithTitleProps & {
  onConfirm: () => void;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = (props) => {
  const { onRequestClose, children, onConfirm, ...restProps } = props;

  return (
    <ModalWithTitle {...restProps} onRequestClose={onRequestClose}>
      <>
        <div className="mb-8">{children}</div>
        <div className="flex justify-end">
          <FormSubmitButton className="mr-4" type="button" onClick={onConfirm}>
            Yes
          </FormSubmitButton>
          <FormSecondaryButton onClick={onRequestClose}>No</FormSecondaryButton>
        </div>
      </>
    </ModalWithTitle>
  );
};

export default ConfirmationModal;
