import React, { FC, memo, useMemo } from 'react';

import { ErrorBoundaryContent } from 'app/ErrorBoundary';
import { ReactComponent as DiamondIcon } from 'app/icons/diamond.svg';
import PageLayout, { SpinnerSection } from 'app/layouts/PageLayout';
import DelegateForm from 'app/templates/DelegateForm';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { T } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos, getAccountForChain } from 'temple/accounts';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccount } from 'temple/front';
import { TempleChainName } from 'temple/types';

const Delegate = memo(() => {
  const currentAccount = useAccount();

  const tezosAccount = useMemo(() => getAccountForChain(currentAccount, TempleChainName.Tezos), [currentAccount]);

  return (
    <PageLayout
      pageTitle={
        <>
          <DiamondIcon className="mr-1 h-4 w-auto stroke-current" /> <T id="delegate" />
        </>
      }
    >
      {tezosAccount ? (
        <DelegateContent
          account={tezosAccount}
          ownerAddress={currentAccount.type === TempleAccountType.ManagedKT ? currentAccount.owner : undefined}
        />
      ) : (
        <div className="p-4 w-full max-w-sm mx-auto">{UNDER_DEVELOPMENT_MSG}</div>
      )}
    </PageLayout>
  );
});

export default Delegate;

const DelegateContent: FC<{ account: AccountForTezos; ownerAddress?: string }> = ({ account, ownerAddress }) => {
  const gasBalance = useBalance(TEZ_TOKEN_SLUG, account.address);

  const isLoading = !gasBalance.value && gasBalance.isSyncing;

  return isLoading ? (
    <SpinnerSection />
  ) : gasBalance.error ? (
    <ErrorBoundaryContent errorMessage={String(gasBalance.error)} onTryAgainClick={gasBalance.refresh} />
  ) : (
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <DelegateForm account={account} balance={gasBalance.value ?? ZERO} ownerAddress={ownerAddress} />
      </div>
    </div>
  );
};
