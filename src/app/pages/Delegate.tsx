import React, { memo, useMemo } from 'react';

import { DeadEndBoundaryError, ErrorBoundaryContent } from 'app/ErrorBoundary';
import { ReactComponent as DiamondIcon } from 'app/icons/diamond.svg';
import PageLayout, { SpinnerSection } from 'app/layouts/PageLayout';
import DelegateForm from 'app/templates/DelegateForm';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { T } from 'lib/i18n';
import { ZERO } from 'lib/utils/numbers';
import { getAccountForTezos } from 'temple/accounts';
import { useAccount, useTezosChainByChainId } from 'temple/front';

interface Props {
  tezosChainId: string;
}

const Delegate = memo<Props>(({ tezosChainId }) => {
  const currentAccount = useAccount();

  const account = useMemo(() => getAccountForTezos(currentAccount), [currentAccount]);
  const chain = useTezosChainByChainId(tezosChainId);

  if (!chain || !account) throw new DeadEndBoundaryError();

  const gasBalance = useBalance(TEZ_TOKEN_SLUG, account.address, chain);

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
            <DelegateForm network={chain} account={account} balance={gasBalance.value ?? ZERO} />
          </div>
        </div>
      )}
    </PageLayout>
  );
});

export default Delegate;
