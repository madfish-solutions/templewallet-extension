import React, { FC, useState } from 'react';

import ImportTabSwitcher from 'app/atoms/ImportTabSwitcher';
import PageLayout from 'app/layouts/PageLayout';
import { TID, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';

import { ImportFromKeystoreFile } from './import/ImportFromKeystoreFile/ImportFromKeystoreFile';
import { ImportFromSeedPhrase } from './import/ImportSeedPhrase/ImportFromSeedPhrase';
import { LockedWalletExists } from './LockedWalletExists';
import { SetWalletPassword } from './setWalletPassword/SetWalletPassword';

interface ImportWalletProps {
  tabSlug?: string;
}

const importWalletOptions: {
  slug: string;
  i18nKey: TID;
}[] = [
  {
    slug: 'seed-phrase',
    i18nKey: 'seedPhrase'
  },
  {
    slug: 'keystore-file',
    i18nKey: 'keystoreFile'
  }
];

export const ImportWallet: FC<ImportWalletProps> = ({ tabSlug = 'seed-phrase' }) => {
  const { locked } = useTempleClient();

  const [seedPhrase, setSeedPhrase] = useState('');
  const [keystorePassword, setKeystorePassword] = useState('');
  const [isSeedEntered, setIsSeedEntered] = useState(false);

  const isImportFromSeedPhrase = tabSlug === 'seed-phrase';

  return (
    <PageLayout pageTitle={t('importWallet')} contentContainerStyle={{ padding: 0 }}>
      <ImportTabSwitcher tabs={importWalletOptions} activeTabSlug={tabSlug} urlPrefix="/import-wallet" />
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
