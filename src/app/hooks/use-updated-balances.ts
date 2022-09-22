import { useCallback, useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';

import { fetchBalance, useAllTokensBaseMetadata, useSyncTokens, useTezos } from 'lib/temple/front';
import { IAccountToken } from 'lib/temple/repo';

interface UpdatedAssetsInterface extends Omit<IAccountToken, 'latestBalance'> {
  latestBalance: BigNumber;
}

export const useUpdatedBalances = (assets: IAccountToken[], chainId: string, address: string) => {
  const [assetsWithUpdatedBalances, setAssetsWithUpdatedBalances] = useState<UpdatedAssetsInterface[]>([]);

  const tezos = useTezos();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const { isSync } = useSyncTokens();

  const chainIdRef = useRef<string>();
  const addressRef = useRef<string>();

  useEffect(() => void (chainIdRef.current = chainId), [chainId]);
  useEffect(() => void (addressRef.current = address), [address]);

  const updateBalances = useCallback(async () => {
    for (let asset of assets) {
      const { tokenSlug } = asset;
      const shouldLoad = chainIdRef.current === asset.chainId && addressRef.current === asset.account;

      if (!shouldLoad) break;

      const latestBalance = await fetchBalance(tezos, tokenSlug, allTokensBaseMetadata[tokenSlug], address);

      if (!shouldLoad) break;

      setAssetsWithUpdatedBalances(prevState => [...prevState, { ...asset, latestBalance }]);
    }
  }, [address, allTokensBaseMetadata, assets, tezos]);

  useEffect(() => {
    setAssetsWithUpdatedBalances([]);

    if (isSync === false) {
      updateBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSync]);

  return assetsWithUpdatedBalances.map(({ tokenSlug, latestBalance }) => ({ slug: tokenSlug, latestBalance }));
};
