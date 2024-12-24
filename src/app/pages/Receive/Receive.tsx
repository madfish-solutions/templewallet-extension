import React, { memo, useCallback, useState } from 'react';

import { PageTitle } from 'app/atoms';
import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import PageLayout from 'app/layouts/PageLayout';
import { AccountsModal } from 'app/templates/AccountsModal';
import { T, t } from 'lib/i18n';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { AccountDropdownHeader } from './AccountDropdownHeader';
import { NetworkCard } from './NetworkCard';
import { ReceiveModal } from './ReceiveModal';
import { ReceivePayload } from './types';

export const Receive = memo(() => {
  const account = useAccount();
  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();
  const {
    value: accountsModalIsOpen,
    setTrue: openAccountsModal,
    setFalse: closeAccountsModal
  } = useSearchParamsBoolean('accountsModal');
  const [receivePayload, setReceivePayload] = useState<ReceivePayload | null>(null);

  const resetReceivePayload = useCallback(() => setReceivePayload(null), []);

  return (
    <PageLayout pageTitle={<PageTitle title={t('receive')} />}>
      <AccountsModal opened={accountsModalIsOpen} onRequestClose={closeAccountsModal} />
      <AccountDropdownHeader className="mb-5" account={account} onClick={openAccountsModal} />
      {receivePayload && <ReceiveModal onClose={resetReceivePayload} {...receivePayload} />}
      <span className="text-font-description-bold">
        <T id="networkToReceive" />
      </span>
      <div className="mt-3 flex flex-col gap-y-3">
        {evmAddress && (
          <NetworkCard address={evmAddress} chainKind={TempleChainKind.EVM} onQRClick={setReceivePayload} />
        )}
        {tezosAddress && (
          <NetworkCard address={tezosAddress} chainKind={TempleChainKind.Tezos} onQRClick={setReceivePayload} />
        )}
      </div>
    </PageLayout>
  );
});
