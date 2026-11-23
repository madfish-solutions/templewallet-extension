import { useEffect, useMemo, useRef, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';

import { useSelector } from 'app/store';
import {
  use3RouteEvmChainTokensMetadataLoadingSelector,
  use3RouteEvmChainTokensMetadataSelector,
  use3RouteEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-3route-metadata/selectors';
import {
  useLifiConnectedEvmChainTokensMetadataLoadingSelector,
  useLifiConnectedEvmChainTokensMetadataSelector,
  useLifiConnectedEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { fetchEvmStepsAllowances } from '../../evm/fetch-evm-allowances';
import { Route3EvmRoute } from '../../form/interfaces';
import { getTokenSlugFromEvmDexTokenAddress } from '../../utils';

export const useLifiEvmTokensSlugs = (chainId: number) => {
  const isLoading = useLifiConnectedEvmChainTokensMetadataLoadingSelector();
  const lifiEvmTokensMetadataRecord = useLifiConnectedEvmChainTokensMetadataSelector(chainId);

  const lifiTokenSlugs = useMemo(
    () =>
      Object.values(lifiEvmTokensMetadataRecord ?? []).map(token => getTokenSlugFromEvmDexTokenAddress(token.address)),
    [lifiEvmTokensMetadataRecord]
  );

  return {
    isLoading,
    lifiTokenSlugs
  };
};

export const use3RouteEvmTokensSlugs = (chainId: number) => {
  const isLoading = use3RouteEvmChainTokensMetadataLoadingSelector();
  const route3EvmTokensMetadataRecord = use3RouteEvmChainTokensMetadataSelector(chainId);

  const route3EvmTokenSlugs = useMemo(
    () =>
      Object.values(route3EvmTokensMetadataRecord ?? []).map(token =>
        getTokenSlugFromEvmDexTokenAddress(token.address)
      ),
    [route3EvmTokensMetadataRecord]
  );

  return {
    isLoading,
    route3EvmTokenSlugs
  };
};

export const useLifiEvmAllTokensSlugs = () => {
  const metadataRecord = useLifiConnectedEvmTokensMetadataRecordSelector();
  const isLoading = useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.isLoading);

  const lifiTokenSlugs = useMemo(
    () =>
      Object.entries(metadataRecord).flatMap(([chainIdStr, tokensBySlug]) => {
        const chainId = Number(chainIdStr);

        return Object.values(tokensBySlug).map(token =>
          toChainAssetSlug(TempleChainKind.EVM, chainId, getTokenSlugFromEvmDexTokenAddress(token.address))
        );
      }),
    [metadataRecord]
  );

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
      Object.entries(metadataRecord).flatMap(([chainIdStr, tokensBySlug]) => {
        const chainId = Number(chainIdStr);

        return Object.values(tokensBySlug).map(token =>
          toChainAssetSlug(TempleChainKind.EVM, chainId, getTokenSlugFromEvmDexTokenAddress(token.address))
        );
      }),
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

interface EvmAllowanceArrays {
  allowanceSufficient: boolean[];
  onChainAllowances: bigint[];
}

interface UseEvmAllowancesResult extends EvmAllowanceArrays {
  loading: boolean;
  error?: unknown;
}

const NO_ALLOWANCES: EvmAllowanceArrays = { allowanceSufficient: [], onChainAllowances: [] };

export function useEvmAllowances(steps: LiFiStep[] | Route3EvmRoute[]): UseEvmAllowancesResult {
  const allEvmChains = useAllEvmChains();

  const [fetched, setFetched] = useState<EvmAllowanceArrays & { steps: LiFiStep[] | Route3EvmRoute[] }>();
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
        const allowances = await fetchEvmStepsAllowances(stableSteps, allEvmChains);

        if (!cancelled) {
          setFetched({
            steps: stableSteps,
            allowanceSufficient: allowances.map(({ sufficient }) => sufficient),
            onChainAllowances: allowances.map(({ onChain }) => onChain)
          });
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

  const { allowanceSufficient, onChainAllowances } = fetched?.steps === stableSteps ? fetched : NO_ALLOWANCES;

  return { allowanceSufficient, onChainAllowances, loading, error };
}
