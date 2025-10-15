import { useCallback, useEffect, useState } from 'react';

import { dispatch } from 'app/store';
import { putEvmCollectiblesMetadataAction } from 'app/store/evm/collectibles-metadata/actions';
import { putCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import { toastError } from 'app/toaster';
import { fromAssetSlug } from 'lib/assets';
import { fetchEvmCollectibleMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { fetchOneTokenMetadata } from 'lib/metadata/fetch';
import { EvmChain, OneOfChains, TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useLoadCollectibleMetadata = (network: OneOfChains, slug: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const loadMetadata = useCallback(async () => {
    setIsLoading(true);

    try {
      if (network.kind === TempleChainKind.Tezos) {
        await loadTezosMetadata(network, slug);
      } else {
        await loadEvmMetadata(network, slug);
      }
    } catch {
      toastError('Failed to load metadata');
    } finally {
      setIsLoading(false);
    }
  }, [network, slug]);

  useEffect(() => void loadMetadata(), [loadMetadata]);

  return { isLoading, loadMetadata };
};

const loadTezosMetadata = async (network: TezosChain, slug: string) => {
  const [address, id] = fromAssetSlug(slug);
  const tokenId = id ?? '0';

  const metadata = await fetchOneTokenMetadata(network, address, tokenId);

  if (!metadata || !metadata?.name || !metadata?.symbol) {
    throw new Error();
  }

  const metadataToStore = {
    ...metadata,
    decimals: metadata.decimals ? +metadata.decimals : 0,
    address,
    id: tokenId
  };

  dispatch(putCollectiblesMetadataAction({ records: { [slug]: metadataToStore } }));
};

const loadEvmMetadata = async (network: EvmChain, slug: string) => {
  const metadata = await fetchEvmCollectibleMetadataFromChain(network, slug);

  if (!metadata) throw new Error();

  dispatch(
    putEvmCollectiblesMetadataAction({
      chainId: network.chainId,
      records: { [slug]: metadata }
    })
  );
};
