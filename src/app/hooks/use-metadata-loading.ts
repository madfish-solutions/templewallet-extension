import { useMemo } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useFungibleTokens, useCollectibleTokens, useTezos } from 'lib/temple/front';
import { useInterval } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const dispatch = useDispatch();
  const tezos = useTezos();
  const rpcUrl = tezos.rpc.getRpcUrl();

  const { data: tokens } = useFungibleTokens(chainId, publicKeyHash);
  const { data: collectibles } = useCollectibleTokens(chainId, publicKeyHash);

  const slugs = useMemo(() => {
    const tokensSlugs = tokens?.map(t => t.tokenSlug) ?? [];
    const collectiblesSlugs = collectibles?.map(c => c.tokenSlug) ?? [];

    return [...tokensSlugs, ...collectiblesSlugs];
  }, [tokens, collectibles]);

  useInterval(() => void dispatch(loadTokensMetadataAction({ rpcUrl, slugs })), METADATA_SYNC_INTERVAL, [tezos, slugs]);
};
