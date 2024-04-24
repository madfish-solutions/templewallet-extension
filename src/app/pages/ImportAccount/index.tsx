import React, { FC, useEffect, useMemo, useRef } from 'react';

import { TabSwitcher } from 'app/atoms';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TID, T } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { navigate, useLocation } from 'lib/woozie';
import { useTezosNetwork } from 'temple/front';

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

const tabsForAccountsTypes = {
  [TempleAccountType.Imported]: ['private-key', 'mnemonic', 'fundraiser', 'faucet'],
  [TempleAccountType.ManagedKT]: ['managed-kt'],
  [TempleAccountType.WatchOnly]: ['watch-only']
};

const ImportAccount: FC<ImportAccountProps> = ({ tabSlug }) => {
  const location = useLocation();
  const { isMainnet } = useTezosNetwork();

  const prevIsMainnetRef = useRef(isMainnet);

  useAllAccountsReactiveOnAddition();

  const allTabs = useMemo(() => {
    const accountType = new URLSearchParams(location.search).get('accountType');
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

    return unfiltered.filter((value): value is ImportTabDescriptor => {
      if (!isTruthy(value)) {
        return false;
      }

      if (accountType && accountType in tabsForAccountsTypes) {
        return tabsForAccountsTypes[Number(accountType) as keyof typeof tabsForAccountsTypes].includes(value.slug);
      }

      return true;
    });
  }, [isMainnet, location.search]);

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
        {allTabs.length > 1 && (
          <TabSwitcher className="mb-4" tabs={allTabs} activeTabSlug={slug} urlPrefix="/import-account" />
        )}

        <Form />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;
