import React, { memo } from 'react';

import { ErrorBoundaryContent } from 'app/ErrorBoundary';
import { ReactComponent as DiamondIcon } from 'app/icons/diamond.svg';
import PageLayout, { SpinnerSection } from 'app/layouts/PageLayout';
import DelegateForm from 'app/templates/DelegateForm';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { T } from 'lib/i18n';
import { useAccount } from 'lib/temple/front';
import { ZERO } from 'lib/utils/numbers';

const Delegate = memo(() => {
  const { publicKeyHash } = useAccount();

  const gasBalance = useBalance(TEZ_TOKEN_SLUG, publicKeyHash);

  const isLoading = !gasBalance.value && gasBalance.isSyncing;

  return (
    <PageLayout
      pageTitle={
        <>
          <DiamondIcon className="mr-1 h-4 w-auto stroke-current" /> <T id="delegate" />
        </>
      }
    >
      {isLoading ? (
        <SpinnerSection />
      ) : gasBalance.error ? (
        <ErrorBoundaryContent errorMessage={String(gasBalance.error)} onTryAgainClick={gasBalance.refresh} />
      ) : (
        <div className="py-4">
          <div className="w-full max-w-sm mx-auto">
            <DelegateForm balance={gasBalance.value ?? ZERO} />
          </div>
        </div>
      )}
    </PageLayout>
  );
});

export default Delegate;
