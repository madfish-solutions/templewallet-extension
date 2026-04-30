import { FC } from 'react';

import { PageLoader } from 'app/atoms/Loader';
import { SyncSpinner } from 'app/atoms/SyncSpinner';
import { ContentContainer } from 'app/layouts/containers';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { t } from 'lib/i18n';
import { OneOfChains } from 'temple/front';

interface ListViewProps {
  children: ReactChildren;
  isEmpty: boolean;
  isSyncing: boolean;
  isInSearchMode: boolean;
  manageActive: boolean;
  collectiblesDetailsReady?: boolean;
  network?: OneOfChains;
}

export const ListView: FC<ListViewProps> = ({
  children,
  isEmpty,
  isSyncing,
  isInSearchMode,
  manageActive,
  network,
  collectiblesDetailsReady = true
}) => {
  const AdsConstantsModule = useAdsConstantsModule();
  const PartnersPromotionModule = usePartnersPromotionModule();

  let content: ReactChildren;
  if ((isEmpty && isSyncing && !isInSearchMode) || !collectiblesDetailsReady) {
    content = (
      <>
        <PageLoader
          className={AdsConstantsModule && PartnersPromotionModule ? 'mb-8' : undefined}
          stretch
          text={t('nftsLoaderText')}
        />

        {AdsConstantsModule && PartnersPromotionModule && (
          <div className="-mb-7">
            <PartnersPromotionModule.PartnersPromotion
              variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
              id="nfts-loading-view"
              pageName={AdsConstantsModule.NFTS_PAGE_NAME}
            />
          </div>
        )}
      </>
    );
  } else if (isEmpty) {
    content = (
      <AssetsEmptySection forCollectibles manageActive={manageActive} forSearch={isInSearchMode} network={network} />
    );
  } else {
    content = (
      <>
        {children}

        {isSyncing && <SyncSpinner className="mt-6" />}
      </>
    );
  }

  return (
    <ContentContainer withShadow={false} padding={!isEmpty}>
      {content}
    </ContentContainer>
  );
};
