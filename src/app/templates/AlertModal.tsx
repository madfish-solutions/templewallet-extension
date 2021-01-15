import React from "react";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import ModalWithTitle, { ModalWithTitleProps } from "./ModalWithTitle";

export type AlertModalProps = ModalWithTitleProps;

const AlertModal: React.FC<AlertModalProps> = (props) => {
  const { onRequestClose, children, ...restProps } = props;

  return (
    <ModalWithTitle {...restProps} onRequestClose={onRequestClose}>
      <div className="flex flex-col">
        <div className="mb-8">{children}</div>
        <div className="flex justify-end">
          <FormSubmitButton type="button" onClick={onRequestClose}>
            OK
          </FormSubmitButton>
        </div>
      </div>
    </ModalWithTitle>
  );
};

export default AlertModal;
