import React, { FC } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/content-fader';
import { useAppEnv } from 'app/env';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { TestIDProps } from 'lib/analytics';

import ModStyles from './styles.module.css';

import { CLOSE_ANIMATION_TIMEOUT, CloseButton } from './index';

interface MiniPageModalProps extends PropsWithChildren, TestIDProps {
  opened: boolean;
  title?: ReactChildren;
  onRequestClose?: EmptyFn;
  contentPadding?: boolean;
  showHeader?: boolean;
}

export const MiniPageModal: FC<MiniPageModalProps> = ({
  title,
  opened,
  onRequestClose,
  showHeader = true,
  children,
  testID
}) => {
  const { fullPage } = useAppEnv();

  return (
    <Modal
      isOpen={opened}
      closeTimeoutMS={CLOSE_ANIMATION_TIMEOUT}
      htmlOpenClassName="overflow-hidden"
      bodyOpenClassName={ACTIVATE_CONTENT_FADER_CLASSNAME}
      overlayClassName={{
        base: clsx('fixed z-modal-page inset-0', fullPage && 'pb-8'),
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          'flex flex-col absolute left-0 right-0 bg-background overflow-hidden focus:outline-hidden ease-out duration-300',
          fullPage ? 'rounded-8 bottom-8' : 'rounded-t-8 bottom-0',
          LAYOUT_CONTAINER_CLASSNAME,
          ModStyles.base
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      appElement={document.getElementById('root')!}
      onRequestClose={onRequestClose}
      testId={testID}
    >
      {showHeader && (
        <div className="flex items-center border-b-0.5 border-lines p-3 bg-white">
          <div className="w-12" />

          <div className="flex-1 text-center text-font-regular-bold">{title}</div>

          <div className="w-12 flex justify-end">
            <CloseButton onClick={onRequestClose} />
          </div>
        </div>
      )}

      <div className="flex-grow bottom flex flex-col overflow-hidden">{children}</div>
    </Modal>
  );
};
