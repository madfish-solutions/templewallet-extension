import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { toggleFavoriteTokenAction } from 'app/store/settings/actions';
import { useFavoriteTokensSelector } from 'app/store/settings/selectors';

export function useFavoriteTokens() {
  const dispatch = useDispatch();
  const favoriteTokens = useFavoriteTokensSelector();

  const toggleFavoriteToken = useCallback(
    (tokenId: string) => {
      dispatch(toggleFavoriteTokenAction(tokenId));
    },
    [dispatch]
  );

  const isFavorite = useCallback((tokenId: string) => favoriteTokens.includes(tokenId), [favoriteTokens]);

  return {
    favoriteTokens,
    toggleFavoriteToken,
    isFavorite
  };
}
