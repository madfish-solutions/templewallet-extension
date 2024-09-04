import React, { memo, ReactNode } from 'react';

import clsx from 'clsx';

import { FormSubmitButton } from 'app/atoms';
import { TOOLBAR_IS_STICKY } from 'app/layouts/PageLayout';

interface Props {
  popup?: boolean;
  title: ReactNode;
  description: ReactNode | ReactNode[];
  actionName: ReactNode;
  onActionClick?: EmptyFn;
}

export const Banner = memo<Props>(({ popup, title, description, actionName, onActionClick }) => (
  <div
    className={clsx(
      'sticky z-25 flex flex-col p-3 mb-3 bg-white rounded-md shadow-lg',
      TOOLBAR_IS_STICKY ? 'top-14' : 'top-3',
      popup && 'mx-4'
    )}
  >
    <h5 className="text-sm font-inter font-medium leading-4 text-gray-910">{title}</h5>

    <p className="mt-1 text-xs font-inter leading-5 text-gray-700">{description}</p>

    <FormSubmitButton slim className="mt-3" onClick={onActionClick}>
      {actionName}
    </FormSubmitButton>
  </div>
));
