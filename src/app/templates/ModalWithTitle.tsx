import React, { FC, ReactNode } from 'react';

import clsx from 'clsx';

import CustomModal, { CustomModalProps } from 'app/atoms/CustomModal';
import { useAppEnv } from 'app/env';

export interface ModalWithTitleProps extends CustomModalProps {
  title?: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
}

const ModalWithTitle: FC<ModalWithTitleProps> = ({
  title,
  description,
  children,
  className,
  titleClassName,
  ...restProps
}) => {
  const { popup } = useAppEnv();

  return (
    <CustomModal {...restProps} className={clsx('w-full max-w-md pb-4 pt-5', popup ? 'px-4' : 'px-6', className)}>
      <>
        {title ? <h1 className={clsx('mb-4 text-lg font-semibold text-gray-700', titleClassName)}>{title}</h1> : null}
        {description ? <p className="mb-4 text-sm font-normal text-gray-600">{description}</p> : null}

        <div className="text-gray-600 text-sm">{children}</div>
      </>
    </CustomModal>
  );
};

export default ModalWithTitle;
