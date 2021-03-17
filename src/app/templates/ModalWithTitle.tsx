import React, { FC, ReactNode } from "react";

import classNames from "clsx";

import CustomModal, { CustomModalProps } from "app/atoms/CustomModal";
import { useAppEnv } from "app/env";

export type ModalWithTitleProps = CustomModalProps & {
  title?: ReactNode;
};

const ModalWithTitle: FC<ModalWithTitleProps> = ({
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
