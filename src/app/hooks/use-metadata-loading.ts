import { useEffect } from 'react';

import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAccountTokensSelector } from 'app/store/assets/selectors';
import {
  loadTokensMetadataAction,
  loadWhitelistAction,
  resetTokensMetadataLoadingAction
} from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useTezos, useCollectibleTokens } from 'lib/temple/front';
import { TempleChainId } from 'lib/temple/types';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: account } = useAccount();
  const dispatch = useDispatch();
  const tezos = useTezos();

  const tokens = useAccountTokensSelector(account, chainId);
  const { data: collectibles } = useCollectibleTokens(chainId, account);

  const tokensMetadata = useTokensMetadataSelector();

  const slugsWithoutMetadata = useMemoWithCompare(
    () => {
      const tokensSlugs = tokens.reduce<string[]>(
        (acc, { slug }) => (tokensMetadata[slug] ? acc : acc.concat(slug)),
        []
      );
      const collectiblesSlugs = collectibles.reduce<string[]>(
        (acc, { tokenSlug }) => (tokensMetadata[tokenSlug] ? acc : acc.concat(tokenSlug)),
        []
      );

      return tokensSlugs.concat(collectiblesSlugs).sort();
    },
    [tokens, collectibles, tokensMetadata],
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
      if (slugsWithoutMetadata.length < 1) return;

      const rpcUrl = tezos.rpc.getRpcUrl();

      dispatch(loadTokensMetadataAction({ rpcUrl, slugs: slugsWithoutMetadata }));
    },
    METADATA_SYNC_INTERVAL,
    [tezos, slugsWithoutMetadata]
  );
};
