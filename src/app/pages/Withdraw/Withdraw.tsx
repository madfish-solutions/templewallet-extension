import React, { FC, useMemo } from 'react';

import { t } from 'lib/i18n/react';
import { useGasToken } from 'lib/temple/front/assets';

import { ReactComponent as WithdrawIcon } from '../../icons/withdraw.svg';
import { tabInterface, TabsPageLayout } from '../../layouts/TabsPageLayout';
import { Debit } from './Debit/Debit';
import { WithdrawSelectors } from './Withdraw.selectors';

export const Withdraw: FC = () => {
  const { assetName } = useGasToken();

  const tabs = useMemo<tabInterface[]>(() => {
    return [
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debit,
        testID: WithdrawSelectors.Debit
      }
    ];
  }, []);

  return (
    <TabsPageLayout
      tabs={tabs}
      icon={<WithdrawIcon />}
      title={t('withdraw')}
      description={t('withdrawDescription', [assetName, assetName])}
    />
  );
};
