import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';

import { generateMnemonic } from 'bip39';

import { Alert } from 'app/atoms';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';

import { NewSeedBackup } from './create/NewSeedBackup/NewSeedBackup';
import { NewSeedVerify } from './create/NewSeedVerify/NewSeedVerify';
import { Template } from './Template';

export const CreateAnotherWallet: FC = () => {
  const { createOrImportWallet } = useTempleClient();

  const seedPhrase = useMemo(() => generateMnemonic(128), []);
  const [backupCompleted, setBackupCompleted] = useState(false);
  const [error, setError] = useState<ReactNode>(null);

  useAllAccountsReactiveOnAddition();

  const handleVerificationCompleted = useCallback(async () => {
    setError(null);

    try {
      await createOrImportWallet(seedPhrase);
    } catch (err: any) {
      console.error(err);

      setError(err.message);
    }
  }, [createOrImportWallet, seedPhrase]);

  return (
    <PageLayout pageTitle={t('createWallet')}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}
      {!backupCompleted && (
        <Template title={t('backupNewSeedPhrase')}>
          <NewSeedBackup seedPhrase={seedPhrase} onBackupComplete={() => setBackupCompleted(true)} />
        </Template>
      )}
      {backupCompleted && (
        <Template title={t('verifySeedPhrase')}>
          <NewSeedVerify seedPhrase={seedPhrase} onVerificationComplete={handleVerificationCompleted} />
        </Template>
      )}
    </PageLayout>
  );
};
