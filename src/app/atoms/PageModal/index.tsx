import React, { PropsWithChildren, memo } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/ContentFader';
import { ReactComponent as ExIcon } from 'app/icons/base/x.svg';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';

import { IconBase } from '../IconBase';

import ModStyles from './styles.module.css';

interface Props {
  title: string;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const PageModal = memo<PropsWithChildren<Props>>(({ title, opened, onRequestClose, children }) => {
  return (
    <Modal
      isOpen={opened}
      closeTimeoutMS={300}
      overlayClassName={{
        base: 'fixed z-modal-page inset-0 pt-13 pb-8',
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          'h-full flex flex-col bg-white rounded-lg overflow-hidden',
          ModStyles.base,
          'ease-out duration-300'
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      bodyOpenClassName={ACTIVATE_CONTENT_FADER_CLASSNAME}
      htmlOpenClassName="overflow-hidden"
      appElement={document.getElementById('root')!}
      onRequestClose={onRequestClose}
    >
      <div className="flex items-center p-4 border-b border-lines">
        <div className="w-12" />

        <div className="flex-1 text-center text-sm leading-5 font-semibold">{title}</div>

        <div className="w-12 flex justify-end">
          <IconBase Icon={ExIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onRequestClose} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </Modal>
  );
});
