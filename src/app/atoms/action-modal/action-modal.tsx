import React, { memo } from 'react';

import { Button } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';

interface ActionModalProps {
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
  title: string;
}

export const ActionModal = memo<ActionModalProps>(({ onClose, children, title }) => (
  <CustomModal isOpen onRequestClose={onClose}>
    <div className="w-full relative p-3 border-b-0.5 border-gray-300">
      <h1 className="font-semibold leading-6 text-center text-base mx-9">{title}</h1>
      <Button className="absolute top-3 right-3" onClick={onClose}>
        <CloseIcon className="w-6 h-auto text-gray-600 stroke-current" />
      </Button>
    </div>
    {children}
  </CustomModal>
));
