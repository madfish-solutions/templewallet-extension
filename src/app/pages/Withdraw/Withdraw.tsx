import React, { FC, useMemo } from 'react';

import { ReactComponent as WithdrawGreyIcon } from 'app/icons/withdraw-grey.svg';
import { TabInterface, TabsPageLayout } from 'app/layouts/TabsPageLayout';
import { t } from 'lib/i18n/react';

import { Debit } from './Debit/Debit';
import { WithdrawSelectors } from './Withdraw.selectors';

export const Withdraw: FC = () => {
  const tabs = useMemo<TabInterface[]>(() => {
    return [
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debit,
        testID: WithdrawSelectors.debitTab
      }
    ];
  }, []);

  return (
    <TabsPageLayout
      tabs={tabs}
      icon={<WithdrawGreyIcon />}
      title={t('withdraw')}
      description={t('withdrawDescription')}
    />
  );
};
