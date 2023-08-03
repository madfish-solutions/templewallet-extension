import { useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';
import { useCustomCompareMemo } from 'use-custom-compare';

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
import { useInterval } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const dispatch = useDispatch();
  const tezos = useTezos();

  const tokensMetadata = useTokensMetadataSelector();

  const { data: tokensSlugs } = useAllStoredTokensSlugs(chainId);

  const slugsWithoutMetadata = useCustomCompareMemo(
    () => tokensSlugs?.filter(slug => !isDefined(tokensMetadata[slug])),
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
