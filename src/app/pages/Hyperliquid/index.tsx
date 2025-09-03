import React, { memo } from 'react';

import { OpenInFullPage, useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';

import { HyperliquidClientsProvider } from './clients';
import { PriceChart } from './price-chart';

export const HyperliquidPage = memo(() => {
  const { fullPage } = useAppEnv();

  return (
    <>
      {!fullPage && <OpenInFullPage />}

      <PageLayout pageTitle="Hyperliquid" paperClassName="w-[48rem]">
        <HyperliquidClientsProvider>
          <HyperliquidPageContent />
        </HyperliquidClientsProvider>
      </PageLayout>
    </>
  );
});

const HyperliquidPageContent = memo(() => {
  return (
    <div className="flex flex-col gap-y-2">
      <PriceChart coinName="@107" interval="5m" />
    </div>
  );
});
