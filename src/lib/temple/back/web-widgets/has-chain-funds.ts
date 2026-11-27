import { fetchFromStorage } from 'lib/storage';
import { TempleChainKind } from 'temple/types';

const PERSIST_ROOT_KEY = 'persist:temple-root';

type EvmBalancesAtomic = Record<string, Record<string, StringRecord>>;

interface EvmBalancesSlice {
  balancesAtomic?: EvmBalancesAtomic;
}

interface StoredEvmBalances {
  balancesAtomic?: string;
}

interface TezosBalancesSlice {
  balancesAtomic?: Record<string, { data?: StringRecord }>;
}

interface PersistedRoot {
  evmBalances?: EvmBalancesSlice | string;
  balances?: TezosBalancesSlice | string;
}

const parseSlice = <T>(slice: T | string | undefined): T | undefined => {
  if (typeof slice !== 'string') return slice;
  try {
    return JSON.parse(slice);
  } catch {
    return undefined;
  }
};

const hasPositiveEntry = (record: StringRecord | undefined) =>
  Boolean(record && Object.values(record).some(value => value && value !== '0'));

const readEvmBalancesAtomic = async () => {
  const stored = await fetchFromStorage<string>('persist:root.evmBalances').catch(() => null);
  if (stored) return parseSlice<EvmBalancesAtomic>(parseSlice<StoredEvmBalances>(stored)?.balancesAtomic);

  const root = await fetchFromStorage<PersistedRoot>(PERSIST_ROOT_KEY).catch(() => null);

  return parseSlice(root?.evmBalances)?.balancesAtomic;
};

export const hasChainFunds = async (
  chainKind: TempleChainKind,
  chainId: string,
  addresses: string[]
): Promise<boolean> => {
  if (chainKind === TempleChainKind.EVM) {
    const atomic = (await readEvmBalancesAtomic()) ?? {};
    return addresses.some(address => hasPositiveEntry(atomic[address]?.[chainId]));
  }

  const root = await fetchFromStorage<PersistedRoot>(PERSIST_ROOT_KEY).catch(() => null);
  if (!root) return false;

  const atomic = parseSlice(root.balances)?.balancesAtomic ?? {};
  return addresses.some(address => hasPositiveEntry(atomic[`${address}_${chainId}`]?.data));
};
