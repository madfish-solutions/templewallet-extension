import React, { Suspense, memo } from 'react';

import { PageTitle } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import PageLayout from 'app/layouts/PageLayout';

import { StakeEvmPageContent } from './content';

export const StakeEvmPage = memo(() => {
  return (
    <PageLayout pageTitle={<PageTitle title="EVM Staking" />}>
      <Suspense fallback={<PageLoader stretch />}>
        <StakeEvmPageContent />
      </Suspense>
    </PageLayout>
  );
});
