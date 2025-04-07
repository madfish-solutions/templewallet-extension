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
import { CollectiblesSelectors } from '../selectors';

interface CollectiblePageLayoutProps {
  headerRightElement: ReactNode;
  imageElement: ReactNode;
  collectibleName: string;
  collectionDetailsElement: ReactNode;
  onSend: EmptyFn;
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
  collectibleName,
  collectionDetailsElement,
  onSend,
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

  return (
    <PageLayout headerRightElem={headerRightElement}>
      <div
        className="relative flex items-center justify-center rounded-8 mb-4 overflow-hidden bg-grey-4"
        style={{ aspectRatio: '1/1' }}
      >
        {imageElement}
      </div>

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

          <StyledButton
            size="L"
            color="primary"
            onClick={onSend}
            testID={CollectiblesSelectors.sendButton}
            className="my-6"
            disabled={account.type === TempleAccountType.WatchOnly}
          >
            <T id="send" />
          </StyledButton>

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
