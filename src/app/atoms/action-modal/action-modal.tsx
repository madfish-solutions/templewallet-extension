import React, { memo } from 'react';

import { Button } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';

interface ActionModalProps {
  closable?: boolean;
  onClose?: () => void;
  children: JSX.Element | JSX.Element[];
  title: string;
  overlayClassName?: string;
}

export const ActionModal = memo<ActionModalProps>(({ onClose, children, closable = true, title, overlayClassName }) => (
  <CustomModal isOpen overlayClassName={overlayClassName} onRequestClose={onClose}>
    <div className="w-full relative p-3 border-b-0.5 border-gray-300">
      <h1 className="font-semibold leading-6 text-center text-base mx-9">{title}</h1>
      {closable && (
        <Button className="absolute top-3 right-3" onClick={onClose}>
          <CloseIcon className="w-6 h-auto text-gray-600 stroke-current" />
        </Button>
      )}
    </div>
    {children}
  </CustomModal>
));
