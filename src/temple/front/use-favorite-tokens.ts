import { useCallback } from 'react';

import { useTempleClient } from 'lib/temple/front/client';
import { useSettings } from 'temple/front/ready';

export function useFavoriteTokens() {
  const { updateSettings } = useTempleClient();
  const { favoriteTokens = [] } = useSettings();

  const addFavoriteToken = useCallback(
    async (tokenId: string) => {
      if (!favoriteTokens.includes(tokenId)) {
        await updateSettings({
          favoriteTokens: [tokenId, ...favoriteTokens]
        });
      }
    },
    [favoriteTokens, updateSettings]
  );

  const removeFavoriteToken = useCallback(
    async (tokenId: string) => {
      await updateSettings({
        favoriteTokens: favoriteTokens.filter(id => id !== tokenId)
      });
    },
    [favoriteTokens, updateSettings]
  );

  const isFavorite = useCallback((tokenId: string) => favoriteTokens.includes(tokenId), [favoriteTokens]);

  return {
    favoriteTokens,
    addFavoriteToken,
    removeFavoriteToken,
    isFavorite
  };
}
