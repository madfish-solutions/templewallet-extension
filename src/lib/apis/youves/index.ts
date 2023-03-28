import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { catchError, from, map, Observable, of } from 'rxjs';
import { contracts } from 'youves-sdk/src/networks';
import { mainnetTokens, mainnetNetworkConstants } from 'youves-sdk/src/networks.mainnet';
import { AssetDefinition, createEngine, Storage, StorageKey, StorageKeyReturnType } from 'youves-sdk/src/public';
import { UnifiedStaking } from 'youves-sdk/src/staking/unified-staking';

import { YOUVES_INDEXER_URL } from './constants';

const indexerConfig = { url: YOUVES_INDEXER_URL, headCheckUrl: '' };
const MULTIPLIER = 100;

class MemoryStorage implements Storage {
  public storage: Map<string, any>;

  constructor() {
    this.storage = new Map();
  }
  public async set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void> {
    this.storage.set(key, value);
  }
  public async get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]> {
    return this.storage.get(key);
  }
  public async delete<K extends StorageKey>(key: K): Promise<void> {
    this.storage.delete(key);
  }
  public async clear() {
    this.storage.clear();
  }
}

export const getYOUTokenApr$ = (
  tezos: TezosToolkit,
  assetToUsdExchangeRate: BigNumber,
  governanceToUsdExchangeRate: BigNumber
): Observable<number> => {
  const unifiedStaking = new UnifiedStaking(tezos, indexerConfig, mainnetNetworkConstants);

  return from(unifiedStaking.getAPR(assetToUsdExchangeRate, governanceToUsdExchangeRate)).pipe(
    map(value => Number(value.multipliedBy(MULTIPLIER))),
    catchError(error => {
      console.log('Youves error: get YOU token APR', error);

      return of(0);
    })
  );
};

export const getYouvesTokenApr$ = (tezos: TezosToolkit, token: AssetDefinition): Observable<number> => {
  const youves = createEngine({
    tezos,
    contracts: token,
    storage: new MemoryStorage(),
    indexerConfig,
    tokens: mainnetTokens,
    activeCollateral: contracts.mainnet[0].collateralOptions[0],
    networkConstants: mainnetNetworkConstants
  });

  return from(youves.getSavingsPoolV3YearlyInterestRate()).pipe(
    map(value => Number(value.multipliedBy(MULTIPLIER))),
    catchError(error => {
      console.log(`Youves error: get ${token.id} token APR`, error);

      return of(0);
    })
  );
};
