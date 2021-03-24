import { BcdNetwork, buildQuery } from "./base";

export type BcdGetBigmapKeysParams = {
  network: BcdNetwork;
  pointer: number;
  offset?: number;
  size?: number;
};

export const getBigmapKeys = buildQuery<
  BcdGetBigmapKeysParams,
  BcdGetBigmapKeysResponse
>("GET", ({ network, pointer }) => `/bigmap/${network}/${pointer}/keys`, [
  "offset",
  "size",
]);

export type BcdGetBigmapKeysResponse = {
  count: number;
  data: {
    key: {
      prim: string;
      type: string;
      children?: any[];
      value?: any;
    };
    value: {
      prim: string;
      type: string;
      children?: any[];
      value?: any;
    } | null;
  };
}[];
