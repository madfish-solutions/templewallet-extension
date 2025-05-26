import React, { FC } from 'react';

import { useBooleanState } from 'lib/ui/hooks';

import { BuyWithCreditCard } from './buy-with-credit-card-modal';
import { CryptoExchangeModal } from './crypto-exchange-modal';
import { CryptoExchangeDataProvider } from './crypto-exchange-modal/context';

export { CryptoExchangeDataProvider, useCryptoExchangeDataState } from './crypto-exchange-modal/context';
export * from './crypto-exchange-modal/components/ExchangeCountdown';

interface BuyModalsProps {
  cryptoExchangeModalOpened: boolean;
  debitCreditCardModalOpened: boolean;
  closeCryptoExchangeModal: EmptyFn;
  closeDebitCreditCardModal: EmptyFn;
}

export const BuyModals: FC<BuyModalsProps> = ({
  cryptoExchangeModalOpened,
  debitCreditCardModalOpened,
  closeCryptoExchangeModal,
  closeDebitCreditCardModal
}) => (
  <>
    <CryptoExchangeDataProvider>
      <CryptoExchangeModal opened={cryptoExchangeModalOpened} onRequestClose={closeCryptoExchangeModal} />
    </CryptoExchangeDataProvider>

    <BuyWithCreditCard opened={debitCreditCardModalOpened} onRequestClose={closeDebitCreditCardModal} />
  </>
);

export const useBuyModalsState = () => {
  const [cryptoExchangeModalOpened, openCryptoExchangeModal, closeCryptoExchangeModal] = useBooleanState(false);
  const [debitCreditCardModalOpened, openDebitCreditCardModal, closeDebitCreditCardModal] = useBooleanState(false);

  return {
    cryptoExchangeModalOpened,
    openCryptoExchangeModal,
    closeCryptoExchangeModal,
    debitCreditCardModalOpened,
    openDebitCreditCardModal,
    closeDebitCreditCardModal
  };
};
