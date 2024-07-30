import React, { PropsWithChildren, memo } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/ContentFader';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/base/chevron_left.svg';
import { ReactComponent as ExIcon } from 'app/icons/base/x.svg';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';

import { IconBase } from '../IconBase';

import ModStyles from './styles.module.css';

interface Props {
  title: string;
  opened: boolean;
  onRequestClose: EmptyFn;
  onBackClick?: EmptyFn;
}

export const PageModal = memo<PropsWithChildren<Props>>(({ title, opened, onRequestClose, onBackClick, children }) => {
  const { fullPage } = useAppEnv();

  return (
    <Modal
      isOpen={opened}
      closeTimeoutMS={300}
      htmlOpenClassName="overflow-hidden" // Disabling page scroll and/or bounce behind modal
      bodyOpenClassName={ACTIVATE_CONTENT_FADER_CLASSNAME}
      overlayClassName={{
        base: clsx('fixed z-modal-page inset-0', fullPage ? 'pt-13 pb-8' : 'pt-4'),
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          'h-full flex flex-col bg-white overflow-hidden',
          fullPage ? 'rounded-lg' : 'rounded-t-lg',
          ModStyles.base,
          'ease-out duration-300'
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      appElement={document.getElementById('root')!}
      onRequestClose={onRequestClose}
    >
      <div className="flex items-center p-4 border-b border-lines">
        {onBackClick ? (
          <div className="w-12">
            <IconBase Icon={ChevronLeftIcon} className="text-grey-1 cursor-pointer" onClick={onBackClick} />
          </div>
        ) : (
          <div className="w-12" />
        )}

        <div className="flex-1 text-center text-font-regular-bold">{title}</div>

        <div className="w-12 flex justify-end">
          <IconBase Icon={ExIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onRequestClose} />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </Modal>
  );
});
