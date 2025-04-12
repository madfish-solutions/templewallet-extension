import React, { memo, useCallback } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { getCollectibleName, getCollectionName } from 'lib/metadata/utils';
import { navigate } from 'lib/woozie';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmAttributes } from '../components/Attributes';
import { EvmCollectiblePageImage } from '../components/CollectiblePageImage';
import { CollectionDetails } from '../components/CollectionDetails';
import { EvmDetails } from '../components/Details';
import { QuickActionsPopper } from '../components/QuickActionsPopper';

import { BaseContent } from './Base';
import { EvmNoMetadataContent } from './NoMetadata';

interface Props {
  chainId: number;
  assetSlug: string;
}

export const EvmContent = memo<Props>(({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const accountPkh = useAccountAddressForEvm();
  const metadata = useEvmCollectibleMetadataSelector(chainId, assetSlug);

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.EVM, String(chainId), assetSlug)),
    [chainId, assetSlug]
  );

  if (!accountPkh || !network) throw new DeadEndBoundaryError();
  if (!metadata)
    return (
      <EvmNoMetadataContent
        assetSlug={assetSlug}
        network={network}
        accountPkh={accountPkh}
        onSendClick={onSendButtonClick}
      />
    );

  const collectibleName = getCollectibleName(metadata);
  const collectionName = getCollectionName(metadata);

  const showSegmentControl = metadata.attributes && metadata.attributes.length > 0;

  return (
    <BaseContent
      headerRightElement={<QuickActionsPopper assetSlug={assetSlug} network={network} />}
      imageElement={<EvmCollectiblePageImage metadata={metadata} />}
      collectibleName={collectibleName}
      collectionDetailsElement={<CollectionDetails title={collectionName} />}
      onSend={onSendButtonClick}
      description={metadata.description}
      showSegmentControl={showSegmentControl}
      detailsElement={
        <EvmDetails network={network} assetSlug={assetSlug} accountPkh={accountPkh} metadata={metadata} />
      }
      attributesElement={<EvmAttributes attributes={metadata.attributes} />}
    />
  );
});
