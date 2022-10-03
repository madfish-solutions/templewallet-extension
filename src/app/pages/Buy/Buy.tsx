import React, { FC, useMemo } from 'react';

import { t } from 'lib/i18n/react';
import { useGasToken } from 'lib/temple/front/assets';

import { tabInterface, TabsPageLayout } from '../../layouts/TabsPageLayout';
import { ReactComponent as ShoppingCartIcon } from './../../icons/shopping-cart.svg';
import { BuySelectors } from './Buy.selectors';
import { Crypto } from './Crypto/Crypto';
import { Debit } from './Debit/Debit';

export const Buy: FC = () => {
  const { assetName } = useGasToken();

  const tabs = useMemo<tabInterface[]>(() => {
    return [
      {
        slug: 'crypto',
        title: t('topUpCrypto'),
        Component: Crypto,
        testID: BuySelectors.Crypto
      },
      {
        slug: 'debit',
        title: t('topUpDebit'),
        Component: Debit,
        testID: BuySelectors.Debit
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
