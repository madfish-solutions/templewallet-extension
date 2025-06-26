import React, { FC } from 'react';

import { ActionModalBodyContainer } from 'app/atoms/action-modal';

interface DialogBodyProps {
  description?: ReactChildren;
}

export const DialogBody: FC<PropsWithChildren<DialogBodyProps>> = ({ children, description }) => (
  <ActionModalBodyContainer>
    {description && <p className="w-full text-center text-font-description text-grey-1 pt-1.5 pb-1">{description}</p>}
    {children}
  </ActionModalBodyContainer>
);
