import { useEffect } from 'react';

import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAccountAssetsSelector } from 'app/store/assets/selectors';
import { loadTokensMetadataAction, resetTokensMetadataLoadingAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useTezos } from 'lib/temple/front';
import { useInterval, useMemoWithCompare } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: account } = useAccount();
  const dispatch = useDispatch();
  const tezos = useTezos();

  const tokens = useAccountAssetsSelector(account, chainId, 'tokens');

  const assetsMetadata = useTokensMetadataSelector();

  const slugsWithoutMetadata = useMemoWithCompare(
    () => tokens.reduce<string[]>((acc, { slug }) => (assetsMetadata[slug] ? acc : acc.concat(slug)), []),
    [tokens, assetsMetadata],
    isEqual
  );

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
