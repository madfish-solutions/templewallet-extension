import { buildQuery } from "lib/build-query";

import { api } from "./base";

export const bakingBadGetBaker = buildQuery<BakingBadGetBakerParams, BakingBadGetBakerResponse>(
  api,
  "GET",
  ({ address }) => `/bakers/${address}`,
  ["configs", "insurance", "contribution"]
);

export const bakingBadGetKnownBakers = buildQuery<
  Omit<BakingBadGetBakerParams, "address">,
  BakingBadGetBakerResponse
>(api, "GET", "/bakers", ["configs", "insurance", "contribution"]);

export type BakingBadGetBakerParams = {
  address: string;
  configs?: boolean;
  insurance?: boolean;
  contribution?: boolean;
}

export type BakingBadGetBakerResponse = {
  address: string;
  name: string;
  logo: string | null;
  balance: number;
  stakingBalance: number;
  stakingCapacity: number;
  maxStakingBalance: number;
  freeSpace: number;
  fee: number;
  minDelegation: number;
  payoutDelay: number;
  payoutPeriod: number;
  openForDelegation: boolean;
  estimatedRoi: number;
  serviceType: "tezos_only" | "multiasset" | "exchange" | "tezos_dune";
  serviceHealth: "active" | "closed" | "dead";
  payoutTiming: "stable" | "unstable" | "suspicious" | "no_data";
  payoutAccuracy: "precise" | "inaccurate" | "suspicious" | "no_data";
  audit: string;
  config?: BakingBadBakerConfig;
  insurance?: BakingBadBakerInsurance | null;
  contribution?: BakingBadBakerContribution | null;
} | "";

export type BakingBadBakerValueHistoryItem<T> = {
  cycle: number;
  value: T;
};

export type BakingBadBakerConfig = {
  address: string;
  fee: BakingBadBakerValueHistoryItem<number>[];
  minDelegation: BakingBadBakerValueHistoryItem<number>[];
  allocationFee: BakingBadBakerValueHistoryItem<boolean>[];
  payoutFee: BakingBadBakerValueHistoryItem<boolean>[];
  payoutDelay: BakingBadBakerValueHistoryItem<number>[];
  payoutPeriod: BakingBadBakerValueHistoryItem<number>[];
  minPayout: BakingBadBakerValueHistoryItem<number>[];
  rewardStruct: BakingBadBakerValueHistoryItem<number>[];
  payoutRatio: BakingBadBakerValueHistoryItem<number>[];
  maxStakingThreshold: BakingBadBakerValueHistoryItem<number>[];
  openForDelegation: BakingBadBakerValueHistoryItem<boolean>[];
  ignored: string[];
  sources: string[];
};

export type BakingBadBakerInsurance = {
  address: string;
  insuranceAddress: string;
  insuranceAmount: number;
  coverage: number;
};

export type BakingBadBakerContribution = {
  address: string;
  title: string;
  link: string;
  icon: string;
};
