import { useCallback } from 'react';

import { useEvmCategorizedAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { estimate as genericEstimate } from 'temple/evm/estimate';
import { EvmChain } from 'temple/front';

interface EvmEstimationInput {
  assetSlug: string;
  accountPkh: HexString;
  network: EvmChain;
  txData: HexString;
}

export const useEstimationData = ({ assetSlug, accountPkh, network, txData }: EvmEstimationInput) => {
  const assetMetadata = useEvmCategorizedAssetMetadata(assetSlug, network.chainId);

  const estimate = useCallback(async () => {
    try {
      if (!assetMetadata) {
        throw new Error('Asset metadata not found');
      }

      return await genericEstimate(network, {
        from: accountPkh,
        to: assetMetadata.address as HexString,
        value: BigInt(0),
        data: txData
      });
    } catch (err) {
      console.warn(err);

      throw err;
    }
  }, [assetMetadata, network, accountPkh, txData]);

  return useTypedSWR(['evm-approve-estimation-data', assetSlug, accountPkh, network.chainId, txData], estimate, {
    shouldRetryOnError: false,
    focusThrottleInterval: 10_000,
    dedupingInterval: 10_000
  });
};
