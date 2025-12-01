import React, { memo, useCallback, useEffect, useState } from 'react';

import { AssetsSegmentControl } from 'app/atoms/AssetsSegmentControl';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout from 'app/layouts/PageLayout';
import { AppHeader } from 'app/templates/AppHeader';
import { DAppConnectionRefsProvider } from 'app/templates/DAppConnection/dapp-connection-refs';
import { ExploreActionButtonsBar } from 'app/templates/ExploreActionButtons';
import { toastSuccess } from 'app/toaster';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { HistoryAction, navigate } from 'lib/woozie';

import { CollectiblesTab } from '../Collectibles/CollectiblesTab';

import { KoloCardWidgetModal } from './OtherComponents/KoloCard/KoloCardWidgetModal';
import { KoloCryptoCardPreview } from './OtherComponents/KoloCard/KoloCryptoCardPreview';
import { TokensTab } from './OtherComponents/Tokens/Tokens';
import { TotalEquityBanner } from './OtherComponents/TotalEquityBanner';

const Home = memo(() => {
  const [tabSlug] = useLocationSearchParamValue('tab');

  const [initToastMessage, setInitToastMessage] = useInitToastMessage();

  const [isKoloModalOpened, setIsKoloModalOpened] = useState(false);

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

  const handleOpenKoloModal = useCallback(() => setIsKoloModalOpened(true), []);

  const handleCloseKoloModal = useCallback(() => setIsKoloModalOpened(false), []);

  return (
    <PageLayout Header={AppHeader} contentPadding={false}>
      <div className="flex flex-col pt-1 px-4 bg-white">
        <TotalEquityBanner />

        <ExploreActionButtonsBar additionalButtonType="activity" className="mt-4" />

        <div className="mt-6 relative">
          <KoloCryptoCardPreview onClick={handleOpenKoloModal} />
          <div
            className="rounded-lg w-full h-24 rounded-12 bg-grey-4 -mt-[68px] transform
                       transition-transform duration-200 ease-out peer-hover:translate-y-2"
          />
        </div>

        <AssetsSegmentControl
          tabSlug={tabSlug}
          className="mt-6"
          onTokensTabClick={onTokensTabClick}
          onCollectiblesTabClick={onCollectiblesTabClick}
        />
      </div>

      <KoloCardWidgetModal opened={isKoloModalOpened} onRequestClose={handleCloseKoloModal} />

      <SuspenseContainer>
        <DAppConnectionRefsProvider>
          {tabSlug === 'collectibles' ? <CollectiblesTab /> : <TokensTab />}
        </DAppConnectionRefsProvider>
      </SuspenseContainer>
    </PageLayout>
  );
});

export default Home;
