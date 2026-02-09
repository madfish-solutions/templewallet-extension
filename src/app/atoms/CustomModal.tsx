import React, { FC } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

type CustomModalProps = Modal.Props & React.PropsWithChildren;

const CustomModal: FC<CustomModalProps> = props => {
  const { className, overlayClassName, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      appElement={document.getElementById('root')!}
      closeTimeoutMS={200}
      className={{
        base: clsx('bg-background rounded z-30 shadow-2xl opacity-0', className),
        afterOpen: 'opacity-100 transition ease-out duration-300',
        beforeClose: ''
      }}
      overlayClassName={{
        base: clsx(
          'fixed inset-0 z-modal-page p-4',
          'bg-black bg-opacity-15 opacity-0',
          'flex items-center justify-center',
          overlayClassName
        ),
        afterOpen: 'opacity-100 transition ease-out duration-300',
        beforeClose: ''
      }}
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
