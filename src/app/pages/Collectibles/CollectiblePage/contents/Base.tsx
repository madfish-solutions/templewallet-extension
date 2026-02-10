import React, { FC, ReactNode, useRef, useState } from 'react';

import { SyncSpinner } from 'app/atoms';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import PageLayout from 'app/layouts/PageLayout';
import { setTestID } from 'lib/analytics';
import { t, T } from 'lib/i18n';
import { TempleAccountType } from 'lib/temple/types';
import { useAccount } from 'temple/front';

import { Description } from '../components/Description';
import { ImageContainer } from '../components/ImageContainer';
import { CollectiblesSelectors } from '../selectors';

interface CollectiblePageLayoutProps {
  headerRightElement: ReactNode;
  imageElement: ReactNode;
  scamAlertElement?: ReactNode;
  collectibleName: string;
  collectionDetailsElement: ReactNode;
  onSend: EmptyFn;
  onListForSale?: EmptyFn;
  listForSaleTestIDProperties?: object;
  description?: string | null;
  showSegmentControl?: boolean;
  detailsElement: ReactNode;
  attributesElement: ReactNode;
  isLoading?: boolean;
  sendButtonDisabled?: boolean;
}

export const BaseContent: FC<CollectiblePageLayoutProps> = ({
  headerRightElement,
  imageElement,
  scamAlertElement,
  collectibleName,
  collectionDetailsElement,
  onSend,
  onListForSale,
  listForSaleTestIDProperties,
  description,
  showSegmentControl,
  detailsElement,
  attributesElement,
  isLoading = false
}) => {
  const account = useAccount();

  const [tab, setTab] = useState<'details' | 'attributes'>('details');
  const detailsTabRef = useRef<HTMLDivElement>(null);
  const attributesTabRef = useRef<HTMLDivElement>(null);

  const isWatchOnlyAccount = account.type === TempleAccountType.WatchOnly;

  return (
    <PageLayout headerRightElem={headerRightElement}>
      {scamAlertElement && (
        <>
          {scamAlertElement}
          <span className="mb-4" />
        </>
      )}
      <ImageContainer>{imageElement}</ImageContainer>

      <div
        className="max-w-88 max-h-12 text-font-regular-bold leading-6 truncate"
        {...setTestID(CollectiblesSelectors.collectibleTitle)}
      >
        {collectibleName}
      </div>

      {isLoading ? (
        <SyncSpinner className="mt-6" />
      ) : (
        <>
          {collectionDetailsElement}

          <div className="flex gap-2 my-6 w-full">
            <StyledButton
              size="L"
              color="primary"
              onClick={onSend}
              testID={CollectiblesSelectors.sendButton}
              className="flex-1"
              disabled={isWatchOnlyAccount}
            >
              <T id="send" />
            </StyledButton>
            {onListForSale && (
              <StyledButton
                size="L"
                color="primary-low"
                onClick={onListForSale}
                testID={CollectiblesSelectors.listForSaleButton}
                testIDProperties={listForSaleTestIDProperties}
                className="flex-1"
                disabled={isWatchOnlyAccount}
              >
                <T id="listForSale" />
              </StyledButton>
            )}
          </div>

          <Description text={description} className="mb-6" />

          {showSegmentControl && (
            <SegmentedControl
              name="collectible-details-attributes"
              activeSegment={tab}
              setActiveSegment={setTab}
              className="mb-4"
              segments={[
                {
                  label: t('details'),
                  value: 'details',
                  ref: detailsTabRef
                },
                {
                  label: t('attributes'),
                  value: 'attributes',
                  ref: attributesTabRef
                }
              ]}
            />
          )}

          <div className="w-full">
            {tab === 'attributes' && showSegmentControl ? attributesElement : detailsElement}
          </div>
        </>
      )}
    </PageLayout>
  );
};
