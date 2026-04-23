import { Activity, useEffect } from 'react';

import { AssetsViewStateController } from 'app/atoms/AssetsViewStateController';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useActiveTabState } from 'app/hooks/use-assets-view-state';
import { StickyBar } from 'app/layouts/containers';
import PageLayout from 'app/layouts/PageLayout';
import { AppHeader } from 'app/templates/AppHeader';
import { DAppConnectionRefsProvider } from 'app/templates/DAppConnection/dapp-connection-refs';
import { DepositModal } from 'app/templates/DepositModal';
import { EarnDepositStats } from 'app/templates/EarnDepositStats';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { KoloCardWidgetModal } from 'app/templates/KoloCard/KoloCardWidgetModal';
import { toastSuccess } from 'app/toaster';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { useBooleanState } from 'lib/ui/hooks';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';

import { NotificationBanner } from './OtherComponents/Tokens/components/NotificationBanner';
import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';

const Home = () => {
  const { activeTab } = useActiveTabState();
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

  const isCollectibleTab = activeTab === 'collectibles';

  return (
    <PageLayout Header={AppHeader} bgWhite={false} contentPadding={false}>
      <div className="flex flex-col pt-2 pb-0 px-4">
        <TotalEquityBanner />

        <ExploreActionButtonsBar additionalButtonType="activity" onDepositClick={openDepositModal} className="mt-4" />
      </div>

      <EarnDepositStats isHomePage containerClassName="mt-6 mb-3" onCryptoCardClick={openCryptoCardModal} />

      <NotificationBanner />

      <StickyBar>
        <AssetsViewStateController />
      </StickyBar>

      <SuspenseContainer>
        <DAppConnectionRefsProvider>
          <Activity mode={isCollectibleTab ? 'hidden' : 'visible'} name="home-tokens-tab">
            <TokensTab />
          </Activity>

          <Activity mode={isCollectibleTab ? 'visible' : 'hidden'} name="home-collectibles-tab">
            <CollectiblesTab />
          </Activity>
        </DAppConnectionRefsProvider>
      </SuspenseContainer>

      <KoloCardWidgetModal opened={cryptoCardModalOpened} onRequestClose={closeCryptoCardModal} />
      <DepositModal opened={depositModalOpened} onRequestClose={closeDepositModal} />
    </PageLayout>
  );
};

export default Home;
