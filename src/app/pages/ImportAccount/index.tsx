import React, { FC, useMemo } from 'react';

import { TabSwitcher } from 'app/atoms';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TID, T } from 'lib/i18n';

import { ByFundraiserForm } from './ByFundraiserForm';
import { ByMnemonicForm } from './ByMnemonicForm';
import { ByPrivateKeyForm } from './ByPrivateKeyForm';
import { FromFaucetForm } from './FromFaucetForm';
import { ManagedKTForm } from './ManagedKTForm';
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
          <DownloadIcon className="w-auto h-4 mr-1 stroke-current" />
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
