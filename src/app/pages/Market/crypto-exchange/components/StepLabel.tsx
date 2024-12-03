import React, { memo } from 'react';

import { T, TID } from 'lib/i18n';

interface Props {
  title: TID;
  description: TID;
}

export const StepLabel = memo<Props>(({ title, description }) => {
  return (
    <div className="flex flex-col py-1 mt-1 mb-4 gap-y-0.5">
      <p className="text-font-description-bold">
        <T id={title} />
      </p>
      <p className="text-font-description text-grey-1">
        <T id={description} />
      </p>
    </div>
  );
});
