import { contracts, AssetDefinition } from 'youves-sdk';

import { YouvesTokensEnum } from './enums';

const youvesTokensIds: string[] = [YouvesTokensEnum.UBTC, YouvesTokensEnum.UUSD];

export const youvesTokensRecord = Object.values(contracts.mainnet)
  .filter(token => youvesTokensIds.includes(token.id))
  .reduce(
    (acc: Record<string, AssetDefinition>, token) => ({
      ...acc,
      [token.id]: token
    }),
    {}
  );
