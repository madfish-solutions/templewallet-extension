import React from "react";
import { t } from "lib/i18n/react";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import ModalWithTitle, {
  ModalWithTitleProps,
} from "app/templates/ModalWithTitle";

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
          <FormSecondaryButton small className="mr-3" onClick={onRequestClose}>
            {t("cancel")}
          </FormSecondaryButton>
          <FormSubmitButton small type="button" onClick={onConfirm}>
            {t("ok")}
          </FormSubmitButton>
        </div>
      </>
    </ModalWithTitle>
  );
};

export default ConfirmationModal;
