import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { ReactComponent as AddIcon } from 'app/icons/base/plus_circle.svg';
import { T } from 'lib/i18n';

interface Props {
  onAddContactClick: EmptyFn;
}

export const EmptySection = memo<Props>(({ onAddContactClick }) => (
  <div className="w-full h-full flex flex-col items-center">
    <EmptyState stretch forSearch={false} textI18n="noContacts" />

    <Button
      className="w-fit flex flex-row mb-8 px-2 py-1 bg-secondary-low rounded-md text-font-description-bold text-secondary"
      onClick={onAddContactClick}
    >
      <IconBase Icon={AddIcon} size={12} className="stroke-current" />
      <T id="addNewContact" />
    </Button>
  </div>
));
