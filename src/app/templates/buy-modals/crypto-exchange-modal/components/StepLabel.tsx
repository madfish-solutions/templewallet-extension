import React, { memo } from 'react';

import { T, TID } from 'lib/i18n';

import DoneGif from '../assets/done.gif';
import LoadingGif from '../assets/loading.gif';

const GIF_CONTAINER_CLASSNAME = 'flex shrink-0 justify-center items-center w-[58px] h-[58px]';

type Status = 'none' | 'loading' | 'done';

interface Props {
  title: TID;
  description: TID;
  status?: Status;
}

export const StepLabel = memo<Props>(({ title, description, status = 'none' }) => (
  <div className="flex flex-row gap-x-2 mt-1 mb-4">
    <div className="flex flex-col py-1 gap-y-0.5">
      <p className="text-font-description-bold">
        <T id={title} />
      </p>
      <p className="text-font-description text-grey-1">
        <T id={description} />
      </p>
    </div>
    {(() => {
      switch (status) {
        case 'loading':
          return (
            <div className={GIF_CONTAINER_CLASSNAME}>
              <img src={LoadingGif} alt="loading" width={50} height={50} className="object-contain" />
            </div>
          );
        case 'done':
          return (
            <div className={GIF_CONTAINER_CLASSNAME}>
              <img src={DoneGif} alt="done" width={42} height={42} className="object-contain" />
            </div>
          );
        default:
          return null;
      }
    })()}
  </div>
));
