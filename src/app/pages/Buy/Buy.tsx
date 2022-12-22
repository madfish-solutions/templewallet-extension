import React, { FC, useMemo } from 'react';

import { t } from 'lib/i18n';
import { useGasToken } from 'lib/temple/front';

import { TabInterface, TabsPageLayout } from '../../layouts/TabsPageLayout';
import { ReactComponent as ShoppingCartIcon } from './../../icons/shopping-cart.svg';
import { BuySelectors } from './Buy.selectors';
import { Crypto } from './Crypto/Crypto';
import { Debit } from './Debit/Debit';

export const Buy: FC = () => {
  const { assetName } = useGasToken();

  const tabs = useMemo<TabInterface[]>(() => {
    return [
      {
        slug: 'crypto',
        title: t('topUpCrypto'),
        Component: Crypto,
        trackID: BuySelectors.Crypto
      },
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debit,
        trackID: BuySelectors.Debit
      }
    ];
  }, []);

  return (
    <TabsPageLayout
      tabs={tabs}
      icon={<ShoppingCartIcon />}
      title={t('topUpBuy')}
      description={t('topUpDescription', [assetName, assetName])}
    />
  );
};
