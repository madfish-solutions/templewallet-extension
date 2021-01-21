import React from "react";
import { t } from "lib/i18n/react";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import ModalWithTitle, {
  ModalWithTitleProps,
} from "app/templates/ModalWithTitle";

export type AlertModalProps = ModalWithTitleProps;

const AlertModal: React.FC<AlertModalProps> = (props) => {
  const { onRequestClose, children, ...restProps } = props;

  return (
    <ModalWithTitle {...restProps} onRequestClose={onRequestClose}>
      <div className="flex flex-col">
        <div className="mb-8">{children}</div>
        <div className="flex justify-end">
          <FormSubmitButton type="button" onClick={onRequestClose}>
            {t("ok")}
          </FormSubmitButton>
        </div>
      </div>
    </ModalWithTitle>
  );
};

export default AlertModal;
