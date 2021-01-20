import classNames from "clsx";
import * as React from "react";
import { useAppEnv } from "app/env";
import CustomModal, { CustomModalProps } from "app/atoms/CustomModal";

export type ModalWithTitleProps = CustomModalProps & {
  title?: React.ReactNode;
};

const ModalWithTitle: React.FC<ModalWithTitleProps> = ({
  title,
  children,
  className,
  ...restProps
}) => {
  const { popup } = useAppEnv();

  return (
    <CustomModal
      {...restProps}
      className={classNames(
        "w-full max-w-md",
        popup ? "px-4" : "px-6",
        "pb-4 pt-5",
        className
      )}
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
