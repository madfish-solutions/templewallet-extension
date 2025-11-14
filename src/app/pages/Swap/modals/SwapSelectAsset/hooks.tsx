import { useEffect, useMemo, useRef, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';

import { useSelector } from 'app/store';
import {
  use3RouteEvmChainTokensMetadataSelector,
  use3RouteEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-3route-metadata/selectors';
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

import { Route3EvmRoute, getCommonStepProps } from '../../form/interfaces';

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

export const use3RouteEvmTokensSlugs = (chainId: number) => {
  const { metadata: route3EvmTokensMetadataRecord, isLoading } = use3RouteEvmChainTokensMetadataSelector(chainId);

  const route3EvmTokenSlugs = useMemo(
    () =>
      Object.values(route3EvmTokensMetadataRecord ?? []).map(token => {
        return token.address === EVM_ZERO_ADDRESS ? EVM_TOKEN_SLUG : toTokenSlug(token.address, 0);
      }),
    [route3EvmTokensMetadataRecord]
  );

  return {
    isLoading,
    route3EvmTokenSlugs
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

export const use3RouteEvmAllTokensSlugs = () => {
  const metadataRecord = use3RouteEvmTokensMetadataRecordSelector();
  const isLoading = useSelector(({ route3EvmTokensMetadata }) => route3EvmTokensMetadata.isLoading);

  const route3EvmTokenSlugs = useMemo(
    () =>
      Object.entries(metadataRecord).flatMap(([chainIdStr, tokensBySlug]) =>
        Object.values(tokensBySlug).map(token =>
          toChainAssetSlug(
            TempleChainKind.EVM,
            Number(chainIdStr),
            token.address === EVM_ZERO_ADDRESS ? EVM_TOKEN_SLUG : toTokenSlug(token.address, 0)
          )
        )
      ),
    [metadataRecord]
  );

  return {
    isLoading,
    route3EvmTokenSlugs
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

export function useEvmAllowances(steps: LiFiStep[] | Route3EvmRoute[]): UseEvmAllowancesResult {
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
            const { fromChainId, fromToken, fromAmount, fromAddress, approvalAddress } = getCommonStepProps(step);
            const network = allEvmChains[fromChainId];
            const evmToolkit = network ? getViemPublicClient(network) : undefined;

            if (!network || !evmToolkit) return { sufficient: true, allowance: toBigInt(ZERO) };

            if (EVM_ZERO_ADDRESS === fromToken.address) {
              return { sufficient: true, allowance: toBigInt(ZERO) };
            }

            const onChainAllowance = await evmToolkit.readContract({
              address: fromToken.address as HexString,
              abi: [erc20AllowanceAbi],
              functionName: 'allowance',
              args: [fromAddress as HexString, approvalAddress as HexString]
            });

            return {
              sufficient: onChainAllowance >= BigInt(fromAmount),
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
