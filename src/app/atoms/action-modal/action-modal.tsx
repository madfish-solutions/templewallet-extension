import React, { memo } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import {
  FULL_PAGE_LAYOUT_CONTAINER_CLASSNAME,
  FULL_PAGE_WRAP_OVERLAY_CLASSNAME,
  LAYOUT_CONTAINER_CLASSNAME
} from 'app/layouts/containers';

import actionModalStyles from './action-modal.module.css';

interface ActionModalProps {
  hasCloseButton?: boolean;
  onClose?: EmptyFn;
  children: JSX.Element | JSX.Element[];
  title: string;
  className?: string;
}

export const ActionModal = memo<ActionModalProps>(({ onClose, children, hasCloseButton = true, title }) => {
  const { fullPage } = useAppEnv();

  return (
    <CustomModal
      isOpen
      className="rounded-lg"
      overlayClassName={clsx(
        'backdrop-blur-xs',
        fullPage && [
          FULL_PAGE_WRAP_OVERLAY_CLASSNAME,
          actionModalStyles.fullPageOverlay,
          LAYOUT_CONTAINER_CLASSNAME,
          FULL_PAGE_LAYOUT_CONTAINER_CLASSNAME
        ]
      )}
      onRequestClose={onClose}
    >
      <div className="relative p-3 border-b-0.5 border-lines w-modal">
        <h1 className="text-center text-font-regular-bold mx-9">{title}</h1>
        {hasCloseButton && (
          <Button className="absolute top-3 right-3" onClick={onClose}>
            <IconBase Icon={CloseIcon} size={16} className="text-grey-2" />
          </Button>
        )}
      </div>
      {children}
    </CustomModal>
  );
});
