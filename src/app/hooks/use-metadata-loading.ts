import { useDispatch } from 'react-redux';

import { loadTokensMetadataAction } from 'app/store/tokens-metadata/actions';
import { METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useAccount, useChainId, useTezos } from 'lib/temple/front';
import { useAllStoredAccountTokensSlugs } from 'lib/temple/front/assets';
import { useInterval } from 'lib/ui/hooks';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const dispatch = useDispatch();
  const tezos = useTezos();
  const rpcUrl = tezos.rpc.getRpcUrl();

  const { data: slugs } = useAllStoredAccountTokensSlugs(chainId, publicKeyHash);

  useInterval(() => slugs && dispatch(loadTokensMetadataAction({ rpcUrl, slugs })), METADATA_SYNC_INTERVAL, [
    rpcUrl,
    slugs
  ]);
};
