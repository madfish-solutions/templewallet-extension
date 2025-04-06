import React, { memo, useCallback, useRef, useState } from 'react';

import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import PageLayout from 'app/layouts/PageLayout';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { setTestID } from 'lib/analytics';
import { t, T } from 'lib/i18n';
import { getCollectibleName, getCollectionName } from 'lib/metadata/utils';
import { navigate } from 'lib/woozie';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CollectiblesSelectors } from '../selectors';

import { EvmAttributes } from './Attributes';
import { EvmCollectiblePageImage } from './CollectiblePageImage';
import { CollectionDetails } from './CollectionDetails';
import { Description } from './Description';
import { EvmDetails } from './Details';
import { QuickActionsPopper } from './QuickActionsPopper';

interface Props {
  evmChainId: number;
  assetSlug: string;
}

export const EvmContent = memo<Props>(({ evmChainId, assetSlug }) => {
  const network = useEvmChainByChainId(evmChainId);
  const publicKeyHash = useAccountAddressForEvm();
  const metadata = useEvmCollectibleMetadataSelector(evmChainId, assetSlug);

  if (!publicKeyHash || !network || !metadata) throw new DeadEndBoundaryError();

  const [tab, setTab] = useState<'details' | 'attributes'>('details');

  const detailsTabRef = useRef<HTMLDivElement>(null);
  const attributesTabRef = useRef<HTMLDivElement>(null);

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.EVM, String(evmChainId), assetSlug)),
    [evmChainId, assetSlug]
  );

  return (
    <PageLayout headerRightElem={<QuickActionsPopper assetSlug={assetSlug} network={network} />}>
      <div
        className="relative flex items-center justify-center rounded-8 mb-4 overflow-hidden bg-grey-4"
        style={{ aspectRatio: '1/1' }}
      >
        <EvmCollectiblePageImage metadata={metadata} />
      </div>

      <div
        className="max-w-88 max-h-12 mb-2 text-font-regular-bold leading-6 truncate"
        {...setTestID(CollectiblesSelectors.collectibleTitle)}
      >
        {getCollectibleName(metadata)}
      </div>

      <CollectionDetails title={getCollectionName(metadata)} />

      <StyledButton
        size="L"
        color="primary"
        onClick={onSendButtonClick}
        testID={CollectiblesSelectors.sendButton}
        className="my-6"
      >
        <T id="send" />
      </StyledButton>

      <Description text={metadata.description} className="mb-6" />

      {metadata.attributes && metadata.attributes.length > 0 && (
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
        {tab === 'attributes' ? (
          <EvmAttributes attributes={metadata.attributes} />
        ) : (
          <EvmDetails network={network} assetSlug={assetSlug} accountPkh={publicKeyHash} metadata={metadata} />
        )}
      </div>
    </PageLayout>
  );
});
