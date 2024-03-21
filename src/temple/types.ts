export enum TempleChainName {
  Tezos = 'tezos',
  EVM = 'evm'
}

export const TempleChainTitle: Record<TempleChainName, string> = {
  [TempleChainName.Tezos]: 'Tezos',
  [TempleChainName.EVM]: 'EVM'
};
