import { useEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDispatch } from 'react-redux';

import {
  loadTokensMetadataAction,
  loadWhitelistAction,
  resetTokensMetadataLoadingAction
} from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useTezos } from 'lib/temple/front';
import { useAllStoredTokensSlugs } from 'lib/temple/front/assets';
import { TempleChainId } from 'lib/temple/types';
import { useInterval } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const dispatch = useDispatch();
  const tezos = useTezos();
  const { publicKeyHash: accountPublicKeyHash } = useAccount();

  const tokensMetadata = useTokensMetadataSelector();

  const { data: tokensSlugs } = useAllStoredTokensSlugs(chainId);

  const slugsWithoutMetadata = useMemo(
    () => tokensSlugs?.filter(slug => !isDefined(tokensMetadata[slug])),
    [tokensSlugs, tokensMetadata]
  );

  useEffect(() => {
    if (chainId === TempleChainId.Mainnet) dispatch(loadWhitelistAction.submit());
  }, [chainId]);

  useEffect(() => {
    dispatch(resetTokensMetadataLoadingAction());

    return () => void dispatch(resetTokensMetadataLoadingAction());
  }, []);

  useInterval(
    () => {
      if (!slugsWithoutMetadata || slugsWithoutMetadata.length < 1) return;

      const rpcUrl = tezos.rpc.getRpcUrl();

      dispatch(loadTokensMetadataAction({ rpcUrl, slugs: slugsWithoutMetadata, accountPublicKeyHash }));
    },
    METADATA_SYNC_INTERVAL,
    [tezos, slugsWithoutMetadata, accountPublicKeyHash]
  );
};
