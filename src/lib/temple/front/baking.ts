import { useCallback, useMemo } from "react";

import { BakingBadBakerValueHistoryItem, bakingBadGetBaker } from "lib/baking-bad";
import { useRetryableSWR } from "lib/swr";
import { useTezos, useNetwork } from "lib/temple/front";
import { getAllBakers, getBaker, TNBaker } from "lib/tezos-nodes";

export function useDelegate(address: string, suspense = true) {
  const tezos = useTezos();

  const getDelegate = useCallback(async () => {
    try {
      return await tezos.rpc.getDelegate(address);
    } catch (err) {
      if (err.status === 404) {
        return null;
      }

      throw err;
    }
  }, [address, tezos]);

  return useRetryableSWR(["delegate", tezos.checksum, address], getDelegate, {
    dedupingInterval: 20_000,
    suspense,
  });
}

type RewardConfig = Record<
  "blocks" |
  "endorses" |
  "fees" |
  "accusationRewards" |
  "accusationLostDeposits" |
  "accusationLostRewards" |
  "accusationLostFees" |
  "revelationRewards" |
  "revelationLostRewards" |
  "revelationLostFees" |
  "missedBlocks" |
  "stolenBlocks" |
  "missedEndorses" |
  "lowPriorityEndorses",
  boolean
>;
type Baker = TNBaker & {
  logo: string;
  feeHistory?: BakingBadBakerValueHistoryItem<number>[];
  rewardConfigHistory: BakingBadBakerValueHistoryItem<RewardConfig>[];
};

export const defaultRewardConfigHistory = [
  {
    cycle: 0,
    value: {
      blocks: true,
      endorses: true,
      fees: true,
      accusationRewards: true,
      accusationLostDeposits: true,
      accusationLostRewards: true,
      accusationLostFees: true,
      revelationRewards: true,
      revelationLostRewards: true,
      revelationLostFees: true,
      missedBlocks: true,
      stolenBlocks: true,
      missedEndorses: true,
      lowPriorityEndorses: true,
    }
  }
];

export function useKnownBaker(address: string | null, suspense = true) {
  const net = useNetwork();
  const fetchBaker = useCallback(async (): Promise<Baker | null> => {
    if (!address) return null;
    try {
      const baker = await getBaker(address);
      if (baker) {
        try {
          const bakingBadBaker = await bakingBadGetBaker({ address, configs: true });
          if (typeof bakingBadBaker === "object") {
            return {
              ...baker,
              fee: bakingBadBaker.fee,
              feeHistory: bakingBadBaker.config?.fee,
              rewardConfigHistory: bakingBadBaker.config?.rewardStruct.map(
                ({ cycle, value: rewardStruct }) => ({
                  cycle,
                  value: {
                    blocks: (rewardStruct & 1) > 0,
                    endorses: (rewardStruct & 2) > 0,
                    fees: (rewardStruct & 4) > 0,
                    accusationRewards: (rewardStruct & 8) > 0,
                    accusationLostDeposits: (rewardStruct & 16) > 0,
                    accusationLostRewards: (rewardStruct & 32) > 0,
                    accusationLostFees: (rewardStruct & 64) > 0,
                    revelationRewards: (rewardStruct & 128) > 0,
                    revelationLostRewards: (rewardStruct & 256) > 0,
                    revelationLostFees: (rewardStruct & 512) > 0,
                    missedBlocks: (rewardStruct & 1024) > 0,
                    stolenBlocks: (rewardStruct & 2048) > 0,
                    missedEndorses: (rewardStruct & 4096) > 0,
                    lowPriorityEndorses: (rewardStruct & 8192) > 0,
                  }
                })
              ) ?? defaultRewardConfigHistory
            };
          }
        } catch {}
      }
      return {
        ...(baker as TNBaker),
        rewardConfigHistory: defaultRewardConfigHistory
      };
    } catch (_err) {
      return null;
    }
  }, [address]);
  return useRetryableSWR(
    net.type === "main" && address ? ["baker", address] : null,
    fetchBaker,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      suspense,
    }
  );
}

export function useKnownBakers(suspense = true) {
  const net = useNetwork();
  const { data: bakers } = useRetryableSWR(
    net.type === "main" ? "all-bakers" : null,
    getAllBakers,
    {
      refreshInterval: 120_000,
      dedupingInterval: 60_000,
      suspense,
    }
  );

  return useMemo(() => (bakers && bakers.length > 1 ? bakers : null), [
    bakers,
  ]);
}
