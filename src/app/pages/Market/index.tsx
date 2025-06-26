import React, { FC, memo, ReactNode } from 'react';

import { CaptionAlert, IconBase, PageTitle } from 'app/atoms';
import { IconBaseProps } from 'app/atoms/IconBase';
import { ReactComponent as CardIcon } from 'app/icons/base/card.svg';
import { ReactComponent as RouteIcon } from 'app/icons/base/route.svg';
import PageLayout from 'app/layouts/PageLayout';
import {
  BuyModals,
  CryptoExchangeDataProvider,
  ExchangeCountdown,
  useBuyModalsState,
  useCryptoExchangeDataState
} from 'app/templates/buy-modals';
import { t } from 'lib/i18n/react';

export const Market = memo(() => {
  const {
    cryptoExchangeModalOpened,
    openCryptoExchangeModal,
    closeCryptoExchangeModal,
    debitCreditCardModalOpened,
    openDebitCreditCardModal,
    closeDebitCreditCardModal
  } = useBuyModalsState();

  return (
    <>
      <PageLayout pageTitle={<PageTitle title={t('market')} />} noScroll>
        <CaptionAlert type="info" message={t('marketPageDisclaimer')} className="mb-4" />

        <CryptoExchangeDataProvider>
          <Option
            Icon={RouteIcon}
            title={t('cryptoExchange')}
            description={t('cryptoExchangeDescription')}
            extraInnerComponent={<Timer />}
            onClick={openCryptoExchangeModal}
          />
        </CryptoExchangeDataProvider>
        <Option
          Icon={CardIcon}
          title={t('debitCreditCard')}
          description={t('debitCreditCardDescription')}
          onClick={openDebitCreditCardModal}
        />
      </PageLayout>

      <BuyModals
        cryptoExchangeModalOpened={cryptoExchangeModalOpened}
        closeCryptoExchangeModal={closeCryptoExchangeModal}
        debitCreditCardModalOpened={debitCreditCardModalOpened}
        closeDebitCreditCardModal={closeDebitCreditCardModal}
      />
    </>
  );
});

const Timer = memo(() => {
  const { exchangeData } = useCryptoExchangeDataState();

  if (!exchangeData) return null;

  return (
    <div className="flex flex-row justify-center items-center w-15 h-5 gap-x-1 bg-warning-low rounded-6">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
      </span>
      <ExchangeCountdown className="text-font-small-bold w-8" />
    </div>
  );
});

interface OptionProps extends Pick<IconBaseProps, 'Icon'> {
  title: string;
  description: string;
  extraInnerComponent?: ReactNode;
  onClick?: EmptyFn;
}

const Option: FC<OptionProps> = ({ Icon, title, description, extraInnerComponent, onClick }) => (
  <div
    className="cursor-pointer flex justify-between items-center mb-3 p-3 gap-x-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
    onClick={onClick}
  >
    <CircleIcon Icon={Icon} size={32} className="text-primary" />

    <div className="flex flex-col gap-y-1">
      <div className="flex flex-row gap-x-2">
        <span className="text-font-medium-bold">{title}</span>
        {extraInnerComponent}
      </div>
      <span className="text-font-description text-grey-1">{description}</span>
    </div>
  </div>
);

const CircleIcon: FC<IconBaseProps> = props => (
  <div className="flex justify-center items-center bg-primary-low p-3 rounded-full">
    <IconBase {...props} />
  </div>
);
