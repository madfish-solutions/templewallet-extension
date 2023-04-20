import React, { FC } from 'react';

import classNames from 'clsx';
import Modal from 'react-modal';

export type CustomModalProps = Modal.Props & React.PropsWithChildren;

const CustomModal: FC<CustomModalProps> = props => {
  const { className, overlayClassName, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      className={classNames('bg-white rounded z-30 shadow-2xl', className)}
      appElement={document.getElementById('root')!}
      closeTimeoutMS={200}
      overlayClassName={classNames(
        'fixed inset-0 z-30',
        'bg-black bg-opacity-75',
        'flex items-center justify-center',
        'p-4',
        overlayClassName
      )}
      onAfterOpen={() => {
        document.body.classList.add('overscroll-y-none');
      }}
      onAfterClose={() => {
        document.body.classList.remove('overscroll-y-none');
      }}
    />
  );
};

export default CustomModal;
