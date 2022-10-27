import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadAdvertisingPromotionActions } from '../store/advertising/advertising-actions';

export const useAdvertising = () => {
  const dispatch = useDispatch();

  useEffect(() => void dispatch(loadAdvertisingPromotionActions.submit()), []);
};
