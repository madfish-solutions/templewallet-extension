import { useEffect } from 'react';

import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import PageLayout from 'app/layouts/PageLayout';
import { AppHeader } from 'app/templates/AppHeader';
import { DAppConnectionRefsProvider } from 'app/templates/DAppConnection/dapp-connection-refs';
import { DepositModal } from 'app/templates/DepositModal';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { KoloCardWidgetModal } from 'app/templates/KoloCard/KoloCardWidgetModal';
import { toastSuccess } from 'app/toaster';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { useBooleanState } from 'lib/ui/hooks';

import { ContentBody } from './content-body';
import { IncomeDashboard } from './income-dashboard';
import { NotificationBanner } from './notification-banner';
import { TotalEquityBanner } from './total-equity-banner';

export const HomeContent = () => {
  const [initToastMessage, setInitToastMessage] = useInitToastMessage();

  const [depositModalOpened, openDepositModal, closeDepositModal] = useBooleanState(false);
  const [cryptoCardModalOpened, openCryptoCardModal, closeCryptoCardModal] = useBooleanState(false);

  useEffect(() => {
    if (!initToastMessage) return;

    const timeout = setTimeout(() => {
      setInitToastMessage(undefined);
      toastSuccess(initToastMessage);
    }, 100);

    return () => clearTimeout(timeout);
  }, [initToastMessage, setInitToastMessage]);

  return (
    <PageLayout Header={AppHeader} bgWhite={false} contentPadding={false}>
      <div className="flex flex-col pt-2 pb-6 px-4">
        <TotalEquityBanner />

        <ExploreActionButtonsBar additionalButtonType="activity" onDepositClick={openDepositModal} className="mt-4" />
      </div>

      <NotificationBanner />

      <IncomeDashboard />

      <SuspenseContainer>
        <DAppConnectionRefsProvider>
          <ContentBody onCryptoCardClick={openCryptoCardModal} />
        </DAppConnectionRefsProvider>
      </SuspenseContainer>

      <KoloCardWidgetModal opened={cryptoCardModalOpened} onRequestClose={closeCryptoCardModal} />
      <DepositModal opened={depositModalOpened} onRequestClose={closeDepositModal} />
    </PageLayout>
  );
};
