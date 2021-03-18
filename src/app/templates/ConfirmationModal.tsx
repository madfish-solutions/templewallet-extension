import React, { FC } from "react";

import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import ModalWithTitle, {
  ModalWithTitleProps,
} from "app/templates/ModalWithTitle";
import { t } from "lib/i18n/react";

export type ConfirmationModalProps = ModalWithTitleProps & {
  onConfirm: () => void;
};

const ConfirmationModal: FC<ConfirmationModalProps> = (props) => {
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
