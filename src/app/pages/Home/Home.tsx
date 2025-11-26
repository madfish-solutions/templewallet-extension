import React, { memo, useCallback, useEffect } from 'react';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout from 'app/layouts/PageLayout';
import { AppHeader } from 'app/templates/AppHeader';
import { BuyModals, useBuyModalsState } from 'app/templates/buy-modals';
import { DAppConnectionRefsProvider } from 'app/templates/DAppConnection/dapp-connection-refs';
import { DepositModal } from 'app/templates/DepositModal';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { toastSuccess } from 'app/toaster';
import { useBooleanState } from 'lib/ui/hooks';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { HistoryAction, navigate } from 'lib/woozie';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';

import { EarnSection } from './OtherComponents/EarnSection';
import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';

const Home = memo(() => {
  const [tabSlug] = useLocationSearchParamValue('tab');

  const [initToastMessage, setInitToastMessage] = useInitToastMessage();

  const [depositModalOpened, openDepositModal, closeDepositModal] = useBooleanState(false);
  const {
    cryptoExchangeModalOpened,
    debitCreditCardModalOpened,
    closeCryptoExchangeModal,
    closeDebitCreditCardModal,
    openCryptoExchangeModal,
    openDebitCreditCardModal
  } = useBuyModalsState();

  useEffect(() => {
    if (!initToastMessage) return;

    const timeout = setTimeout(() => {
      setInitToastMessage(undefined);
      toastSuccess(initToastMessage);
    }, 100);

    return () => clearTimeout(timeout);
  }, [initToastMessage, setInitToastMessage]);

  const onTokensTabClick = useCallback(() => navigate({ search: 'tab=tokens' }, HistoryAction.Replace), []);
  const onCollectiblesTabClick = useCallback(() => navigate({ search: 'tab=collectibles' }, HistoryAction.Replace), []);

  return (
    <PageLayout Header={AppHeader} contentPadding={false}>
      <div className="flex flex-col pt-2 pb-0 px-4 bg-white shadow-bottom">
        <TotalEquityBanner />

        <ExploreActionButtonsBar
          additionalButtonType="activity"
          onDepositClick={openDepositModal}
          className="mt-4 mb-4"
        />
      </div>

      <EarnSection className="mt-6" />

      <SuspenseContainer>
        <DAppConnectionRefsProvider>
          {tabSlug === 'collectibles' ? (
            <CollectiblesTab onTokensTabClick={onTokensTabClick} onCollectiblesTabClick={onCollectiblesTabClick} />
          ) : (
            <TokensTab onTokensTabClick={onTokensTabClick} onCollectiblesTabClick={onCollectiblesTabClick} />
          )}
        </DAppConnectionRefsProvider>
      </SuspenseContainer>

      <DepositModal
        opened={depositModalOpened}
        onRequestClose={closeDepositModal}
        openDebitCreditCardModal={openDebitCreditCardModal}
        openCryptoExchangeModal={openCryptoExchangeModal}
      />

      <BuyModals
        cryptoExchangeModalOpened={cryptoExchangeModalOpened}
        debitCreditCardModalOpened={debitCreditCardModalOpened}
        closeCryptoExchangeModal={closeCryptoExchangeModal}
        closeDebitCreditCardModal={closeDebitCreditCardModal}
      />
    </PageLayout>
  );
});

export default Home;
