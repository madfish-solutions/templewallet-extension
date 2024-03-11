import { useEffect, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import { useAccountTokensSelector } from 'app/store/assets/selectors';
import { resetTokensMetadataLoadingAction } from 'app/store/tokens-metadata/actions';
import { useTokensMetadataPresenceCheck } from 'lib/metadata';
import { useTezosAccountAddress, useTezosNetwork } from 'temple/hooks';

export const useMetadataLoading = () => {
  const { chainId } = useTezosNetwork();
  const account = useTezosAccountAddress();
  const dispatch = useDispatch();

  const tokens = useAccountTokensSelector(account, chainId);
  const slugs = useMemo(() => Object.keys(tokens), [tokens]);

  useEffect(() => {
    dispatch(resetTokensMetadataLoadingAction());

    return () => void dispatch(resetTokensMetadataLoadingAction());
  }, []);

  // TODO: Should there be a time interval?
  useTokensMetadataPresenceCheck(slugs);
};
