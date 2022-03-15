import React, { FC, Suspense } from 'react';

import { ReactComponent as SwapIcon } from 'app/icons/swap.svg';
import PageLayout from 'app/layouts/PageLayout';
import { SwapForm } from 'app/templates/SwapForm/SwapForm';
import { t, T } from 'lib/i18n/react';
import { useNetwork } from 'lib/temple/front';

import { SwapDisclaimer } from './SwapDisclaimer/SwapDisclaimer';

export const Swap: FC = () => {
  const network = useNetwork();

  return (
    <PageLayout
      pageTitle={
        <>
          <SwapIcon className="w-auto h-4 mr-1 stroke-current" /> {t('swap')}
        </>
      }
    >
      <div className="py-4">
        <div className="w-full max-w-sm mx-auto">
          <SwapDisclaimer />

          <Suspense fallback={null}>
            {network.type === 'main' ? (
              <SwapForm />
            ) : (
              <p className="text-center text-sm">
                <T id="noExchangersAvailable" />
              </p>
            )}
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
};
