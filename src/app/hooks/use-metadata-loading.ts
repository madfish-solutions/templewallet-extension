import { useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import {
  loadTokensMetadataAction,
  loadWhitelistAction,
  resetTokensMetadataLoadingAction
} from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useChainId, useTezos } from 'lib/temple/front';
import { useAllStoredTokensSlugs } from 'lib/temple/front/assets';
import { TempleChainId } from 'lib/temple/types';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const dispatch = useDispatch();
  const tezos = useTezos();

  const tokensMetadata = useTokensMetadataSelector();

  const { data: tokensSlugs } = useAllStoredTokensSlugs(chainId);

  const slugsWithoutMetadata = useMemoWithCompare(
    () => tokensSlugs?.filter(slug => !isDefined(tokensMetadata[slug])).sort(),
    [tokensSlugs, tokensMetadata],
    isEqual
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

      dispatch(loadTokensMetadataAction({ rpcUrl, slugs: slugsWithoutMetadata }));
    },
    METADATA_SYNC_INTERVAL,
    [tezos, slugsWithoutMetadata]
  );
};
