import React from 'react';

import { capitalize } from 'lodash';

import { PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n';

import { Achievements } from './achievements';
import { ActiveFeatures } from './active-features';
import { LifetimeEarnings } from './lifetime-earnings';
import { RecentEarnings } from './recent-earnings';

export const RewardsPage = () => (
  <PageLayout pageTitle={<PageTitle icon={<div />} title={capitalize(t('rewards'))} />}>
    <div className="pt-2 pb-6">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
        <RecentEarnings />
        <ActiveFeatures />
        <Achievements />
        <LifetimeEarnings />
      </div>
    </div>
  </PageLayout>
);
