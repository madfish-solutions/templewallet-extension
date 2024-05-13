import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CardIcon } from 'app/icons/base/card.svg';
import { ReactComponent as BuyWithCryptoIcon } from 'app/icons/buy-with-crypto.svg';
import { ReactComponent as CreditCardIcon } from 'app/icons/credit-card.svg';
import { TabInterface, TabsPageLayout } from 'app/layouts/TabsPageLayout';
import { ReactComponent as AliceBobIcon } from 'app/pages/Buy/assets/AliceBob.svg';
import { T, t } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

import { BuySelectors } from '../Buy/Buy.selectors';

import { BuyPageOption } from './BuyPageOption';

export const Market = memo(() => {
  const tabs = useMemo<TabInterface[]>(() => {
    return [
      {
        slug: 'buy',
        title: t('topUpBuy'),
        Component: BuyTab,
        description: t('topUpDescription')
      },
      {
        slug: 'withdraw',
        title: t('withdraw'),
        Component: WithdrawTab,
        description: t('withdrawDescription')
      }
    ];
  }, []);

  return <TabsPageLayout tabs={tabs} Icon={CardIcon} title="Market" />;
});

const BuyTab = memo(() => (
  <div className="flex flex-col gap-4 items-center">
    <BuyPageOption
      Icon={BuyWithCryptoIcon}
      title={t('buyWithCrypto')}
      to="/buy/crypto/exolix"
      testID={BuySelectors.cryptoButton}
    />

    <BuyPageOption Icon={CreditCardIcon} title={t('buyWithCard')} to="/buy/debit" testID={BuySelectors.debitButton} />
  </div>
));

const WithdrawTab = memo(() => {
  const buttonClassName = useMemo(
    () =>
      clsx(
        'w-full mt-4 py-2 px-4 rounded',
        'text-white bg-blue-500 border-2',
        'border-blue-500 hover:border-blue-600 focus:border-blue-600',
        'flex items-center justify-center',
        'shadow-sm hover:shadow focus:shadow',
        'text-base font-medium',
        'transition ease-in-out duration-300'
      ),
    []
  );

  return (
    <div className="mx-auto max-w-sm flex flex-col items-center border-2 rounded-md p-4 mb-4">
      <AliceBobIcon />

      <div className="text-lg text-center mt-4">
        <T id="sellWithAliceBob" />
      </div>

      <div className="text-center px-2 mt-2 mx-auto text-gray-700">
        <T id="sellWithAliceBobDescription" />
      </div>

      <Link className={buttonClassName} to={`/withdraw/debit/alice-bob`}>
        <T id="continue" />
      </Link>
    </div>
  );
});
