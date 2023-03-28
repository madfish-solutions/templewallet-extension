import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensApyActions } from 'app/store/d-apps/actions';

import { useTezos } from '../../lib/temple/front';

export const useTokensApyLoading = () => {
  const dispatch = useDispatch();
  const tezos = useTezos();

  useEffect(() => void dispatch(loadTokensApyActions.submit(tezos)), []);
};
