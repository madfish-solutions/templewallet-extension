import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

import CustomModal, { CustomModalProps } from 'app/atoms/CustomModal';
import { useAppEnv } from 'app/env';

export interface ModalWithTitleProps extends CustomModalProps {
  title?: ReactNode;
}

const ModalWithTitle: FC<ModalWithTitleProps> = ({ title, children, className, ...restProps }) => {
  const { popup } = useAppEnv();

  return (
    <CustomModal {...restProps} className={classNames('w-full max-w-md pb-4 pt-5', popup ? 'px-4' : 'px-6', className)}>
      <>
        {title ? <h1 className="mb-4 text-lg font-semibold text-gray-700">{title}</h1> : null}

        <div className="text-gray-600 text-sm">{children}</div>
      </>
    </CustomModal>
  );
};

export default ModalWithTitle;
