import { useEffect, useState } from 'react';

import { TezosToolkit } from '@taquito/taquito';

import { isFA2Token, fromAssetSlug } from 'lib/assets';
import { useTezos } from 'lib/temple/front';

const getIsFa2AssetSlug = async (assetSlug: string | undefined, tezos: TezosToolkit) => {
  if (assetSlug) {
    const asset = await fromAssetSlug(tezos, assetSlug).catch(() => undefined);

    if (asset === 'tez') {
      return false;
    } else if (asset) {
      return isFA2Token(asset);
    }
  }

  return false;
};

export const useSwapFormTokenIdInput = (assetSlug?: string) => {
  const tezos = useTezos();
  const [showTokenIdInput, setShowTokenIdInput] = useState(false);

  useEffect(() => {
    (async () => {
      const isFa2AssetSlug = await getIsFa2AssetSlug(assetSlug, tezos);

      setShowTokenIdInput(isFa2AssetSlug);
    })();
  }, [assetSlug, tezos]);

  return showTokenIdInput;
};
