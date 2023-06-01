import { useEffect, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDispatch } from 'react-redux';

import { loadTokensMetadataAction, loadWhitelistAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useChainId, useTezos } from 'lib/temple/front';
import { useAllStoredTokensSlugs } from 'lib/temple/front/assets';
import { TempleChainId } from 'lib/temple/types';
import { useInterval } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const dispatch = useDispatch();
  const tezos = useTezos();

  const tokensMetadata = useTokensMetadataSelector();

  const { data: tokensSlugs } = useAllStoredTokensSlugs(chainId);

  const slugsWithoutMetadata = useMemo(
    () => tokensSlugs?.filter(slug => !isDefined(tokensMetadata[slug])),
    [tokensSlugs, tokensMetadata]
  );

  useEffect(() => {
    if (chainId === TempleChainId.Mainnet) dispatch(loadWhitelistAction.submit());
  }, [chainId]);

  useInterval(
    () => {
      if (!slugsWithoutMetadata || slugsWithoutMetadata.length < 1) return;

      const rpcUrl = tezos.rpc.getRpcUrl();

      dispatch(loadTokensMetadataAction({ rpcUrl, slugs: slugsWithoutMetadata }));
    },
    METADATA_SYNC_INTERVAL,
    [tezos, slugsWithoutMetadata]
  );
};
