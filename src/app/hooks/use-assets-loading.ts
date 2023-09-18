import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadAccountTokensActions } from 'app/store/assets/actions';
import { useAccount, useChainId } from 'lib/temple/front';

export const useAssetsLoading = () => {
  const chainId = useChainId()!;
  const { publicKeyHash } = useAccount();

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadAccountTokensActions.submit({ account: publicKeyHash, chainId }));
  }, [chainId, publicKeyHash]);
};
