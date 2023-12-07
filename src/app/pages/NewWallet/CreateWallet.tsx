import React, { FC, useMemo, useState } from 'react';

import { generateMnemonic } from 'bip39';

import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';

import { NewSeedBackup } from './create/NewSeedBackup/NewSeedBackup';
import { NewSeedVerify } from './create/NewSeedVerify/NewSeedVerify';
import { LockedWalletExists } from './LockedWalletExists';
import { SetWalletPassword } from './setWalletPassword/SetWalletPassword';
import { Template } from './Template';

export const CreateWallet: FC = () => {
  const { locked } = useTempleClient();

  const seedPhrase = useMemo(() => generateMnemonic(128), []);
  const [backupCompleted, setBackupCompleted] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);

  return (
    <PageLayout pageTitle={t('createWallet')}>
      <LockedWalletExists locked={locked} />
      {!backupCompleted && (
        <Template title={t('backupNewSeedPhrase')}>
          <NewSeedBackup seedPhrase={seedPhrase} onBackupComplete={() => setBackupCompleted(true)} />
        </Template>
      )}
      {backupCompleted && !verificationCompleted && (
        <Template title={t('verifySeedPhrase')}>
          <NewSeedVerify seedPhrase={seedPhrase} onVerificationComplete={() => setVerificationCompleted(true)} />
        </Template>
      )}
      {backupCompleted && verificationCompleted && <SetWalletPassword seedPhrase={seedPhrase} />}
    </PageLayout>
  );
};
