import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadTokensApyActions } from 'app/store/d-apps/actions';

export const useTokensApyLoading = () => {
  const dispatch = useDispatch();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void dispatch(loadTokensApyActions.submit()), []);
};
