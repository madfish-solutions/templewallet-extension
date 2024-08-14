import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';

interface ActionModalProps {
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
  title: string;
  className?: string;
}

export const ActionModal = memo<ActionModalProps>(({ onClose, children, title, className }) => (
  <CustomModal isOpen onRequestClose={onClose} className={className}>
    <div className="w-full relative p-3 border-b-0.5 border-gray-300">
      <h1 className="font-semibold leading-6 text-center text-base mx-9">{title}</h1>
      <Button className="absolute top-3 right-3" onClick={onClose}>
        <IconBase Icon={CloseIcon} size={16} className="text-grey-2" />
      </Button>
    </div>
    {children}
  </CustomModal>
));
