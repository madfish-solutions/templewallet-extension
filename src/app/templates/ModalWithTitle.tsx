import classNames from "clsx";
import React from "react";
import CustomModal, { CustomModalProps } from "app/atoms/CustomModal";

export type ModalWithTitleProps = CustomModalProps & {
  title?: React.ReactNode;
};

const ModalWithTitle: React.FC<ModalWithTitleProps> = (props) => {
  const { title, children, className, ...restProps } = props;

  return (
    <CustomModal
      {...restProps}
      className={classNames("px-6 pb-4 pt-5 w-full max-w-md", className)}
    >
      <>
        {title ? (
          <h1
            className={classNames(
              "mb-4 text-lg font-semibold",
              "text-gray-700"
            )}
          >
            {title}
          </h1>
        ) : null}

        <div className="text-gray-600 text-sm">{children}</div>
      </>
    </CustomModal>
  );
};

export default ModalWithTitle;
