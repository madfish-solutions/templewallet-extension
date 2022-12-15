import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadAdvertisingPromotionActions } from 'app/store/advertising/actions';

export const useAdvertisingLoading = () => {
  const dispatch = useDispatch();

  useEffect(() => void dispatch(loadAdvertisingPromotionActions.submit()), []);
};
