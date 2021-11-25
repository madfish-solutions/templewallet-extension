import React, { FC } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import NewWallet from 'app/templates/NewWallet';
import { t } from 'lib/i18n/react';

type ImportWalletProps = {
  tabSlug: string | null;
};

const ImportWallet: FC<ImportWalletProps> = ({ tabSlug }) => (
  <PageLayout>
    <NewWallet ownMnemonic title={t('restoreWallet')} tabSlug={tabSlug ?? undefined} />
  </PageLayout>
);

export default ImportWallet;
