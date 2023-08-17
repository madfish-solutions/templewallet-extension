import React, { FC, useEffect, useMemo, useRef } from 'react';

import { TabSwitcher } from 'app/atoms';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { TID, T } from 'lib/i18n';
import { useSetAccountPkh, useAllAccounts, useNetwork } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

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
  const network = useNetwork();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const prevAccLengthRef = useRef(allAccounts.length);
  const prevNetworkRef = useRef(network);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const allTabs = useMemo(
    () =>
      [
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
        network.type !== 'main'
          ? {
              slug: 'faucet',
              i18nKey: 'faucetFileTitle',
              Form: FromFaucetForm
            }
          : undefined,
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
      ].filter((x): x is ImportTabDescriptor => !!x),
    [network.type]
  );
  const { slug, Form } = useMemo(() => {
    const tab = tabSlug ? allTabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? allTabs[0];
  }, [allTabs, tabSlug]);
  useEffect(() => {
    const prevNetworkType = prevNetworkRef.current.type;
    prevNetworkRef.current = network;
    if (prevNetworkType !== 'main' && network.type === 'main' && slug === 'faucet') {
      navigate(`/import-account/private-key`);
    }
  }, [network, slug]);

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
