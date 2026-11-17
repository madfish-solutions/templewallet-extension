import { FC } from 'react';

import { useCollectiblesManageState, useCollectiblesSelectedChainsState } from 'app/hooks/use-assets-view-state';
import {
  useEvmCheckedCollectibleSlugsSelector,
  useEvmCollectiblesMetadataRecordSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { useAccountAddressForEvm } from 'temple/front';

interface EvmDetailsLoadingHintProps {
  chainSlugs: string[];
}

export const EvmDetailsLoadingHint: FC<EvmDetailsLoadingHintProps> = ({ chainSlugs }) => {
  const { manageActive } = useCollectiblesManageState();
  const { selectedChains } = useCollectiblesSelectedChainsState();
  const accountAddressForEvm = useAccountAddressForEvm();
  const evmMetadata = useEvmCollectiblesMetadataRecordSelector();
  const evmCheckedSlugs = useEvmCheckedCollectibleSlugsSelector(accountAddressForEvm);

  const detailsLoading = chainSlugs.some(chainSlug => {
    const [, chainId, slug] = parseChainAssetSlug(chainSlug);

    return (
      typeof chainId === 'number' &&
      (manageActive || selectedChains.length === 0 || selectedChains.includes(chainId)) &&
      !evmMetadata[chainId]?.[slug] &&
      !evmCheckedSlugs?.[chainId]?.[slug]
    );
  });

  if (!detailsLoading) return null;

  return (
    <p className="px-4 mb-2 text-font-description text-grey-1">
      <T id="nftsSearchDetailsLoadingHint" />
    </p>
  );
};
