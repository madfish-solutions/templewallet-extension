import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { getUserTestingGroupNameActions } from '../store/ab-testing/actions';

export const useABTestingLoading = () => {
  const dispatch = useDispatch();

  useEffect(() => void dispatch(getUserTestingGroupNameActions.submit()), []);
};
