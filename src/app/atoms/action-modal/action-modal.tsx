import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';

interface ActionModalProps {
  hasCloseButton?: boolean;
  onClose?: EmptyFn;
  children: JSX.Element | JSX.Element[];
  title: string;
  className?: string;
}

export const ActionModal = memo<ActionModalProps>(({ onClose, children, hasCloseButton = true, title }) => (
  <CustomModal isOpen overlayClassName="backdrop-blur-xs" onRequestClose={onClose}>
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
));
