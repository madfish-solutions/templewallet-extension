import { useMemo } from 'react';

import { useAccountEVMTokensSelector } from 'app/store/evm/assets/selectors';
import { StoredAsset } from 'app/store/tezos/assets/state';

export const useAllAccountEvmAssets = (publicKeyHash: HexString, chainId: number) => {
  const allAccountAssetsRecord = useAccountEVMTokensSelector(publicKeyHash);

  const accountAssetsSlugsWithChainId = useMemo(
    () =>
      Object.keys(allAccountAssetsRecord).filter(slugWithChainId => {
        const recordChainId = slugWithChainId.split('@')[1];

        return Number(recordChainId) === chainId;
      }),
    [allAccountAssetsRecord, chainId]
  );

  return useMemo(() => {
    const assets: StoredAsset[] = [];
    const slugs: string[] = [];

    accountAssetsSlugsWithChainId.forEach(slugWithChainId => {
      assets.push(allAccountAssetsRecord[slugWithChainId]);
      slugs.push(slugWithChainId.split('@')[0]);
    });

    return { assets, slugs };
  }, [accountAssetsSlugsWithChainId, allAccountAssetsRecord]);
};
