import React, { memo } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import ModStyles from './styles.module.css';

export type CustomModalProps = Modal.Props & React.PropsWithChildren;

const CustomModal = memo<CustomModalProps>(props => {
  const { className, overlayClassName, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      appElement={document.getElementById('root')!}
      closeTimeoutMS={200}
      bodyOpenClassName="overscroll-y-none"
      overlayClassName={{
        base: clsx(
          'fixed inset-0 z-modal-dialog',
          'bg-black bg-opacity-75',
          'flex items-center justify-center',
          'p-4',
          'ease-in-out duration-200',
          ModStyles.overlayBase,
          overlayClassName
        ),
        afterOpen: ModStyles.overlayOpened,
        beforeClose: ModStyles.overlayClosed
      }}
      className={{
        base: clsx('bg-white rounded shadow-2xl ease-in-out duration-200', ModStyles.base, className),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
    />
  );
});

export default CustomModal;
