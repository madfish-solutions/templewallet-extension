import { useEffect, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import { useAccountAssetsSelector } from 'app/store/assets/selectors';
import { resetTokensMetadataLoadingAction } from 'app/store/tokens-metadata/actions';
import { useAssetsMetadataWithPresenceCheck } from 'lib/metadata';
import { useAccount, useChainId } from 'lib/temple/front';

export const useMetadataLoading = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: account } = useAccount();
  const dispatch = useDispatch();

  const tokens = useAccountAssetsSelector(account, chainId, 'tokens');
  const slugs = useMemo(() => tokens.map(t => t.slug), [tokens]);

  useEffect(() => {
    dispatch(resetTokensMetadataLoadingAction());

    return () => void dispatch(resetTokensMetadataLoadingAction());
  }, []);

  // TODO: Should there be a time interval?
  useAssetsMetadataWithPresenceCheck(slugs);
};
