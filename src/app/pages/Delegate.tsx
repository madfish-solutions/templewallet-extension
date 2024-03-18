import React, { FC, memo } from 'react';

import { ErrorBoundaryContent } from 'app/ErrorBoundary';
import { ReactComponent as DiamondIcon } from 'app/icons/diamond.svg';
import PageLayout, { SpinnerSection } from 'app/layouts/PageLayout';
import DelegateForm from 'app/templates/DelegateForm';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { UNDER_DEVELOPMENT_MSG } from 'lib/constants';
import { T } from 'lib/i18n';
import { ZERO } from 'lib/utils/numbers';
import { useTezosAccountAddress } from 'temple/front';

const Delegate = memo(() => {
  const publicKeyHash = useTezosAccountAddress();

  return (
    <PageLayout
      pageTitle={
        <>
          <DiamondIcon className="mr-1 h-4 w-auto stroke-current" /> <T id="delegate" />
        </>
      }
    >
      {publicKeyHash ? (
        <DelegateContent publicKeyHash={publicKeyHash} />
      ) : (
        <div className="p-4 w-full max-w-sm mx-auto">{UNDER_DEVELOPMENT_MSG}</div>
      )}
    </PageLayout>
  );
});

export default Delegate;

const DelegateContent: FC<{ publicKeyHash: string }> = ({ publicKeyHash }) => {
  const gasBalance = useBalance(TEZ_TOKEN_SLUG, publicKeyHash);

  const isLoading = !gasBalance.value && gasBalance.isSyncing;

  return isLoading ? (
    <SpinnerSection />
  ) : gasBalance.error ? (
    <ErrorBoundaryContent errorMessage={String(gasBalance.error)} onTryAgainClick={gasBalance.refresh} />
  ) : (
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <DelegateForm balance={gasBalance.value ?? ZERO} />
      </div>
    </div>
  );
};
