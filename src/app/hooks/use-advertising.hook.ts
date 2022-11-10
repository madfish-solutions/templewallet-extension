import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadAdvertisingPromotionActions } from 'app/store/advertising/actions';

export const useAdvertising = () => {
  const dispatch = useDispatch();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void dispatch(loadAdvertisingPromotionActions.submit()), []);
};
