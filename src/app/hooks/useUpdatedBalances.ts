import { useCallback, useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';

import { fetchBalance, useAllTokensBaseMetadata, useSyncTokens, useTezos } from 'lib/temple/front';
import { IAccountToken } from 'lib/temple/repo';

export const useUpdatedBalances = (assets: IAccountToken[], chainId: string, address: string) => {
  const [assetSlugsWithUpdatedBalances, setAssetSlugsWithUpdatedBalances] = useState<Record<string, BigNumber>>({});

  const tezos = useTezos();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const { isSync } = useSyncTokens();

  const chainIdRef = useRef<string>();
  const addressRef = useRef<string>();

  useEffect(() => void (chainIdRef.current = chainId), [chainId]);
  useEffect(() => void (addressRef.current = address), [address]);

  const updateBalances = useCallback(async () => {
    console.log('assets', assets);

    for (let asset of assets) {
      const { tokenSlug } = asset;
      const shouldLoad = chainIdRef.current === asset.chainId && addressRef.current === asset.account;

      if (!shouldLoad) break;

      const latestBalance = await fetchBalance(tezos, tokenSlug, allTokensBaseMetadata[tokenSlug], address);
      console.log('balance', latestBalance.toString());

      if (!shouldLoad) break;

      setAssetSlugsWithUpdatedBalances(prevState => ({ ...prevState, [tokenSlug]: latestBalance }));
    }
  }, [address, allTokensBaseMetadata, assets, tezos]);

  useEffect(() => {
    setAssetSlugsWithUpdatedBalances({});

    if (isSync === false) {
      updateBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSync]);

  console.log('assetSlugsWithUpdatedBalances', assetSlugsWithUpdatedBalances);

  return assetSlugsWithUpdatedBalances;
};
