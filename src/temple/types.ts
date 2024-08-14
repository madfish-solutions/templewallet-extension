export enum TempleChainKind {
  Tezos = 'tezos',
  EVM = 'evm'
}

export const TempleChainTitle: Record<TempleChainKind, string> = {
  [TempleChainKind.Tezos]: 'Tezos',
  [TempleChainKind.EVM]: 'EVM'
};
