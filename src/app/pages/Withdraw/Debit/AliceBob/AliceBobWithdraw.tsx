import React, { FC } from 'react';

import { T } from 'lib/i18n/react';

import PageLayout from '../../../../layouts/PageLayout';
import { InitialStep } from './steps/InitialStep';

//TODO: Add analytics

export const AliceBobWithdraw: FC = () => {
  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="sellTez" />
        </div>
      }
    >
      <InitialStep />
    </PageLayout>
  );
};
