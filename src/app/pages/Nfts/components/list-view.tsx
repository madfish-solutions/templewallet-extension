import { FC } from 'react';

import { PageLoader } from 'app/atoms/Loader';
import { SyncSpinner } from 'app/atoms/SyncSpinner';
import { ContentContainer } from 'app/layouts/containers';
import { AssetsEmptySection } from 'app/templates/assets-empty-section';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { t } from 'lib/i18n';

interface ListViewProps {
  children: ReactChildren;
  isEmpty: boolean;
  noCollectiblesAtAll: boolean;
  isSyncing: boolean;
  isInSearchMode: boolean;
  collectiblesDetailsReady?: boolean;
  openCustomTokenModal: EmptyFn;
}

export const ListView: FC<ListViewProps> = ({
  children,
  noCollectiblesAtAll,
  isEmpty,
  isSyncing,
  isInSearchMode,
  openCustomTokenModal,
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
          text={t('assetsLoaderText')}
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
      <AssetsEmptySection
        forCollectibles
        // Intentionally forcing the same look for both variants
        manageActive={false}
        forSearch={isInSearchMode && !noCollectiblesAtAll}
        onAddCustomTokenClick={openCustomTokenModal}
        stretchSpaceBeforeButton={false}
      />
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
