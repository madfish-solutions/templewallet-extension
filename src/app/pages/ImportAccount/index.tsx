import React, { FC, useMemo } from 'react';

import { IconBase, TabSwitcher } from 'app/atoms';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TID, T } from 'lib/i18n';

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
  useAllAccountsReactiveOnAddition();

  const { slug, Form } = useMemo(() => {
    const tab = tabSlug ? ALL_TABS.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? ALL_TABS[0];
  }, [tabSlug]);

  return (
    <PageLayout
      pageTitle={
        <>
          <IconBase size={12} className="mr-1" Icon={ImportedIcon} />
          <span className="capitalize">
            <T id="importAccount" />
          </span>
        </>
      }
    >
      <div className="py-4">
        <TabSwitcher className="mb-4" tabs={ALL_TABS} activeTabSlug={slug} urlPrefix="/import-account" />

        <Form />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;

const ALL_TABS: ImportTabDescriptor[] = [
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
  {
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
