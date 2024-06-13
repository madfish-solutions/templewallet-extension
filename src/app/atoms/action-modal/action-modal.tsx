import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { ReactComponent as XIcon } from 'app/icons/base/x.svg';

interface ActionModalProps {
  closable?: boolean;
  onClose?: EmptyFn;
  children: JSX.Element | JSX.Element[];
  title: string;
}

export const ActionModal = memo<ActionModalProps>(({ onClose, children, closable = true, title }) => (
  <CustomModal isOpen overlayClassName="backdrop-blur-xs" onRequestClose={onClose}>
    <div className="relative p-3 border-b-0.5 border-lines w-modal">
      <h1 className="text-center text-font-regular-bold mx-9">{title}</h1>
      {closable && (
        <Button className="absolute top-3 right-3" onClick={onClose}>
          <IconBase Icon={XIcon} size={16} className="text-grey-2" />
        </Button>
      )}
    </div>
    {children}
  </CustomModal>
));
