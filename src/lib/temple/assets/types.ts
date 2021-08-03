export interface Token {
  contract: string;
  id?: number;
}

export interface FA2Token extends Token {
  id: number;
}

export type Asset = Token | "tez";
