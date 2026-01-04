import React, { memo, useEffect } from 'react';

import { AssetsViewStateController } from 'app/atoms/AssetsViewStateController';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { StickyBar } from 'app/layouts/containers';
import PageLayout from 'app/layouts/PageLayout';
import { AppHeader } from 'app/templates/AppHeader';
import { DAppConnectionRefsProvider } from 'app/templates/DAppConnection/dapp-connection-refs';
import { DepositModal } from 'app/templates/DepositModal';
import { EarnDepositStats } from 'app/templates/EarnDepositStats';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { toastSuccess } from 'app/toaster';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { useBooleanState } from 'lib/ui/hooks';

import { KoloCardWidgetModal } from '../../templates/KoloCard/KoloCardWidgetModal';
import { CollectiblesTab } from '../Collectibles/CollectiblesTab';

import { UpdateAppBanner } from './OtherComponents/Tokens/components/UpdateAppBanner';
import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';

const Home = memo(() => {
  const [tabSlug] = useLocationSearchParamValue('tab');

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
      <div className="flex flex-col pt-2 pb-0 px-4">
        <TotalEquityBanner />

        <ExploreActionButtonsBar additionalButtonType="activity" onDepositClick={openDepositModal} className="mt-4" />
      </div>

      <EarnDepositStats isHomePage containerClassName="mt-6 mb-3" onCryptoCardClick={openCryptoCardModal} />

      <UpdateAppBanner />

      <StickyBar>
        <AssetsViewStateController />
      </StickyBar>

      <SuspenseContainer>
        <DAppConnectionRefsProvider>
          {tabSlug === 'collectibles' ? <CollectiblesTab /> : <TokensTab />}
        </DAppConnectionRefsProvider>
      </SuspenseContainer>

      <KoloCardWidgetModal opened={cryptoCardModalOpened} onRequestClose={closeCryptoCardModal} />
      <DepositModal opened={depositModalOpened} onRequestClose={closeDepositModal} />
    </PageLayout>
  );
});

export default Home;
