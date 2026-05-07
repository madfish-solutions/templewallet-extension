import { FC, Ref, useRef } from 'react';

import { useStoredEvmCollectibleSelector } from 'app/store/evm/assets/selectors';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useStoredTezosCollectibleSelector } from 'app/store/tezos/assets/selectors';
import { useBalanceSelector } from 'app/store/tezos/balances/selectors';
import {
  useCollectibleMetadataSelector,
  useCollectiblesMetadataLoadingSelector
} from 'app/store/tezos/collectibles-metadata/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { buildObjktCollectibleArtifactUri } from 'lib/images-uri';
import { getTokenName } from 'lib/metadata';
import { getCollectibleName, getCollectionName } from 'lib/metadata/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { ZERO } from 'lib/utils/numbers';
import { useEvmChainByChainId } from 'temple/front/chains';

import { DefaultEvmListItemLayout, DefaultTezosListItemLayout } from './default-layout';
import { ManageEvmListItemLayout, ManageTezosListItemLayout } from './manage-layout';
import { getTezCollectionName } from 'lib/assets/utils';

interface CommonCollectibleItemProps {
  assetSlug: string;
  accountPkh: string;
  showDetails?: boolean;
  manageActive?: boolean;
  index?: number;
  isVisible?: boolean;
  ref?: Ref<CollectiblesListItemElement>;
  testID?: string;
  nameTestID?: string;
}

interface TezosCollectibleItemProps extends CommonCollectibleItemProps {
  tezosChainId: string;
  adultBlur: boolean;
  showDetails: boolean;
  scam?: boolean;
}

export const TezosCollectibleItem: FC<TezosCollectibleItemProps> = ({
  assetSlug,
  accountPkh,
  tezosChainId,
  adultBlur,
  showDetails,
  scam,
  manageActive = false,
  index,
  isVisible,
  ref,
  testID,
  nameTestID
}) => {
  const metadata = useCollectibleMetadataSelector(assetSlug);
  const wrapperElemRef = useRef<HTMLDivElement>(null);
  const balanceAtomic = useBalanceSelector(accountPkh, tezosChainId, assetSlug);

  const storedToken = useStoredTezosCollectibleSelector(accountPkh, tezosChainId, assetSlug);

  const metadatasLoading = useCollectiblesMetadataLoadingSelector();

  const checked = getAssetStatus(balanceAtomic, storedToken?.status) === 'enabled';

  const areDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
  const details = useCollectibleDetailsSelector(assetSlug);

  const collectionName = getTezCollectionName(assetSlug, details);

  const assetName = getTokenName(metadata);

  const commonProps = {
    wrapperElemRef,
    chainId: tezosChainId,
    assetSlug,
    assetName,
    metadata,
    adultBlur,
    areDetailsLoading: areDetailsLoading && details === undefined,
    extraSrc: details?.objktArtifactUri && buildObjktCollectibleArtifactUri(details?.objktArtifactUri),
    mime: details?.mime,
    scam,
    index,
    isVisible,
    ref,
    testID,
    nameTestID
  };

  return manageActive ? (
    <ManageTezosListItemLayout
      {...commonProps}
      collectionName={collectionName}
      checked={checked}
      publicKeyHash={accountPkh}
    />
  ) : (
    <DefaultTezosListItemLayout {...commonProps} showDetails={showDetails} metadatasLoading={metadatasLoading} />
  );
};

interface EvmCollectibleItemProps extends CommonCollectibleItemProps {
  evmChainId: number;
  accountPkh: HexString;
}

export const EvmCollectibleItem: FC<EvmCollectibleItemProps> = ({
  assetSlug,
  evmChainId,
  accountPkh,
  showDetails = false,
  manageActive = false,
  index,
  isVisible,
  ref,
  testID,
  nameTestID
}) => {
  const metadata = useEvmCollectibleMetadataSelector(evmChainId, assetSlug);
  const chain = useEvmChainByChainId(evmChainId);
  const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountPkh, chain!);
  const balanceBeforeTruncate = balance.toString();

  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const storedToken = useStoredEvmCollectibleSelector(accountPkh, evmChainId, assetSlug);

  const checked = getAssetStatus(balanceBeforeTruncate, storedToken?.status) === 'enabled';

  const assetName = getCollectibleName(metadata);
  const collectionName = getCollectionName(metadata);

  const commonProps = {
    chainId: evmChainId,
    assetSlug,
    assetName,
    metadata,
    isVisible,
    index,
    ref,
    testID,
    nameTestID
  };

  return manageActive ? (
    <ManageEvmListItemLayout
      {...commonProps}
      collectionName={collectionName}
      checked={checked}
      publicKeyHash={accountPkh}
    />
  ) : (
    <DefaultEvmListItemLayout {...commonProps} metadatasLoading={metadatasLoading} showDetails={showDetails} />
  );
};
