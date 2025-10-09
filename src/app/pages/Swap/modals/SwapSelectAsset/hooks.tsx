import { useEffect, useMemo, useRef, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';

import { useSelector } from 'app/store';
import {
  useLifiEvmChainTokensMetadataSelector,
  useLifiEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { erc20AllowanceAbi } from 'lib/abi/erc20';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { toBigInt, ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
import { useAllEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useLifiEvmTokensSlugs = (chainId: number) => {
  const { metadata: lifiEvmTokensMetadataRecord, isLoading } = useLifiEvmChainTokensMetadataSelector(chainId);

  const lifiTokenSlugs = useMemo(
    () =>
      Object.values(lifiEvmTokensMetadataRecord ?? []).map(token => {
        return token.address === EVM_ZERO_ADDRESS ? EVM_TOKEN_SLUG : toTokenSlug(token.address, 0);
      }),
    [lifiEvmTokensMetadataRecord]
  );

  return {
    isLoading,
    lifiTokenSlugs
  };
};

export const useLifiEvmAllTokensSlugs = () => {
  const metadataRecord = useLifiEvmTokensMetadataRecordSelector();
  const isLoading = useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.isLoading);

  const lifiTokenSlugs = useMemo(() => {
    return Object.entries(metadataRecord).flatMap(([chainIdStr, tokensBySlug]) => {
      const chainId = Number(chainIdStr);
      return Object.values(tokensBySlug).map(token => {
        const evmTokenSlug = token.address === EVM_ZERO_ADDRESS ? EVM_TOKEN_SLUG : toTokenSlug(token.address, 0);
        return toChainAssetSlug(TempleChainKind.EVM, chainId, evmTokenSlug);
      });
    });
  }, [metadataRecord]);

  return {
    isLoading,
    lifiTokenSlugs
  };
};

export const useFirstValue = <T,>(value: T): T => {
  const ref = useRef(value);
  return ref.current;
};

interface UseEvmAllowancesResult {
  allowanceSufficient: boolean[];
  onChainAllowances: bigint[];
  loading: boolean;
  error?: unknown;
}

export function useEvmAllowances(steps: LiFiStep[]): UseEvmAllowancesResult {
  const allEvmChains = useAllEvmChains();

  const [allowanceSufficient, setAllowanceSufficient] = useState<boolean[]>([]);
  const [onChainAllowances, setOnChainAllowances] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const stableSteps = useMemoWithCompare(() => steps, [steps]);

  useEffect(() => {
    if (!stableSteps?.length) return;

    let cancelled = false;
    async function fetchAllowances() {
      setLoading(true);
      setError(undefined);

      try {
        const results = await Promise.all(
          stableSteps.map(async step => {
            const network = allEvmChains[+step.action.fromChainId];
            const evmToolkit = network ? getViemPublicClient(network) : undefined;
            if (!network || !evmToolkit) return { sufficient: true, allowance: toBigInt(ZERO) };

            if (EVM_ZERO_ADDRESS === step.action.fromToken.address) {
              return { sufficient: true, allowance: toBigInt(ZERO) };
            }

            const requiredAllowance = BigInt(step.action.fromAmount);

            const onChainAllowance = await evmToolkit.readContract({
              address: step.action.fromToken.address as HexString,
              abi: [erc20AllowanceAbi],
              functionName: 'allowance',
              args: [step.action.fromAddress as HexString, step.estimate.approvalAddress as HexString]
            });

            return {
              sufficient: onChainAllowance >= requiredAllowance,
              allowance: onChainAllowance
            };
          })
        );

        if (!cancelled) {
          setAllowanceSufficient(results.map(r => r.sufficient));
          setOnChainAllowances(results.map(r => r.allowance));
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAllowances();

    return () => {
      cancelled = true;
    };
  }, [stableSteps, allEvmChains]);

  return { allowanceSufficient, onChainAllowances, loading, error };
}
