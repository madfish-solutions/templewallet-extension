import { TempleChainKind } from 'temple/types';

export const toTopUpTokenSlug = (symbol: string, chainKind: TempleChainKind, chainId: string) =>
  `${symbol}_${chainKind}_${chainId}`;

export const fromTopUpTokenSlug = (slug: string) =>
  slug.split('_') as [symbol: string, chainKind: TempleChainKind, chainId: string];
