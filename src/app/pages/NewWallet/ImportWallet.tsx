import React, { FC, useState } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n/react';

import { useTempleClient } from '../../../lib/temple/front';
import { TabSwitcher } from '../../atoms/TabSwitcher';
import { ImportFromKeystoreFile } from './import/ImportFromKeystoreFile';
import { ImportFromSeedPhrase } from './import/ImportFromSeedPhrase';
import { LockedWalletExists } from './LockedWalletExists';
import { SetWalletPassword } from './SetWalletPassword';

const importWalletOptions = [
  {
    slug: 'seed-phrase',
    i18nKey: 'seedPhrase'
  },
  {
    slug: 'keystore-file',
    i18nKey: 'keystoreFile'
  }
];

interface ImportWalletProps {
  tabSlug?: string;
}

export const ImportWallet: FC<ImportWalletProps> = ({ tabSlug = 'seed-phrase' }) => {
  const { locked } = useTempleClient();

  const [seedPhrase, setSeedPhrase] = useState('');
  const [keystorePassword, setKeystorePassword] = useState('');
  const [isSeedEntered, setIsSeedEntered] = useState(false);

  const isImportFromSeedPhrase = tabSlug === 'seed-phrase';

  return (
    <PageLayout pageTitle={t('importWallet')} contentContainerStyle={{ padding: 0 }}>
      <TabSwitcher tabs={importWalletOptions} activeTabSlug={tabSlug} urlPrefix="/import-wallet" isImportPage />
      <LockedWalletExists locked={locked} />
      {isImportFromSeedPhrase ? (
        isSeedEntered ? (
          <SetWalletPassword ownMnemonic seedPhrase={seedPhrase} keystorePassword={keystorePassword} />
        ) : (
          <ImportFromSeedPhrase
            seedPhrase={seedPhrase}
            setSeedPhrase={setSeedPhrase}
            setIsSeedEntered={setIsSeedEntered}
          />
        )
      ) : isSeedEntered ? (
        <SetWalletPassword ownMnemonic seedPhrase={seedPhrase} keystorePassword={keystorePassword} />
      ) : (
        <ImportFromKeystoreFile
          setSeedPhrase={setSeedPhrase}
          setKeystorePassword={setKeystorePassword}
          setIsSeedEntered={setIsSeedEntered}
        />
      )}
    </PageLayout>
  );
};
