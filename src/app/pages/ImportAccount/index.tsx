import React, { FC, useEffect, useMemo, useRef } from 'react';

import { TabSwitcher } from 'app/atoms';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TID, T } from 'lib/i18n';
import { isTruthy } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { useTezosNetwork } from 'temple/front';

import { ByFundraiserForm } from './ByFundraiserForm';
import { ByMnemonicForm } from './ByMnemonicForm';
import { ByPrivateKeyForm } from './ByPrivateKeyForm';
import { FromFaucetForm } from './FromFaucetForm';
import { ManagedKTForm } from './ManagedKTForm';
import { WalletFromMnemonicForm } from './wallet-from-mnemonic-form';
import { WatchOnlyForm } from './WatchOnlyForm';

type ImportAccountProps = {
  tabSlug: string | null;
};

interface ImportTabDescriptor {
  slug: string;
  i18nKey: TID;
  Form: FC<{}>;
}

const ImportAccount: FC<ImportAccountProps> = ({ tabSlug }) => {
  const { isMainnet } = useTezosNetwork();

  const prevIsMainnetRef = useRef(isMainnet);

  useAllAccountsReactiveOnAddition();

  const allTabs = useMemo(() => {
    const unfiltered: (ImportTabDescriptor | null)[] = [
      {
        slug: 'private-key',
        i18nKey: 'privateKey',
        Form: ByPrivateKeyForm
      },
      {
        slug: 'mnemonic',
        i18nKey: 'mnemonic',
        Form: ByMnemonicForm
      },
      {
        slug: 'fundraiser',
        i18nKey: 'fundraiser',
        Form: ByFundraiserForm
      },
      {
        slug: 'wallet-from-mnemonic',
        i18nKey: 'walletFromMnemonic',
        Form: WalletFromMnemonicForm
      },
      isMainnet
        ? null
        : {
            slug: 'faucet',
            i18nKey: 'faucetFileTitle',
            Form: FromFaucetForm
          },
      {
        slug: 'managed-kt',
        i18nKey: 'managedKTAccount',
        Form: ManagedKTForm
      },
      {
        slug: 'watch-only',
        i18nKey: 'watchOnlyAccount',
        Form: WatchOnlyForm
      }
    ];

    return unfiltered.filter(isTruthy);
  }, [isMainnet]);

  const { slug, Form } = useMemo(() => {
    const tab = tabSlug ? allTabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? allTabs[0];
  }, [allTabs, tabSlug]);

  useEffect(() => {
    const prevIsMainnet = prevIsMainnetRef.current;
    prevIsMainnetRef.current = isMainnet;

    if (slug === 'faucet' && isMainnet && !prevIsMainnet) navigate(`/import-account/private-key`);
  }, [isMainnet, slug]);

  return (
    <PageLayout
      pageTitle={
        <>
          <DownloadIcon className="w-auto h-4 mr-1 stroke-current" />
          <span className="capitalize">
            <T id="importAccount" />
          </span>
        </>
      }
    >
      <div className="py-4">
        <TabSwitcher className="mb-4" tabs={allTabs} activeTabSlug={slug} urlPrefix="/import-account" />

        <Form />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;
