import React, { FC, Suspense } from 'react';

import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as BuyWithCryptoIcon } from 'app/icons/buy-with-crypto.svg';
import { ReactComponent as CreditCardIcon } from 'app/icons/credit-card.svg';
import { ReactComponent as ShoppingCartIcon } from 'app/icons/shopping-cart.svg';
import PageLayout from 'app/layouts/PageLayout';
import { BuyPageOption } from 'app/templates/BuyPageOption';
import { SpinnerSection } from 'app/templates/SendForm/SpinnerSection';
import { t } from 'lib/i18n';

import { BuySelectors } from './Buy.selectors';

export const Buy: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <ShoppingCartIcon />
        <span className="pl-1">{t('topUpBuy')}</span>
      </>
    }
  >
    <div className="text-center text-gray-700 max-w-sm m-auto">{t('topUpDescription')}</div>

    <div className="mx-4 my-4">
      <ErrorBoundary whileMessage="displaying tab">
        <Suspense fallback={<SpinnerSection />}>
          <div className="flex flex-col gap-4 items-center">
            <BuyPageOption
              Icon={BuyWithCryptoIcon}
              title={t('buyWithCrypto')}
              to="/buy/crypto/exolix"
              testID={BuySelectors.cryptoButton}
            />
            <BuyPageOption
              Icon={CreditCardIcon}
              title={t('buyWithCard')}
              to="/buy/debit"
              testID={BuySelectors.debitButton}
            />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  </PageLayout>
);
