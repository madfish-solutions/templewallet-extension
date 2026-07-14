import { fetchFromStorage } from 'lib/storage';
import { TempleChainKind } from 'temple/types';

const PERSIST_ROOT_KEY = 'persist:temple-root';

interface EvmBalancesSlice {
  balancesAtomic?: Record<string, Record<string, StringRecord>>;
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

export const hasChainFunds = async (
  chainKind: TempleChainKind,
  chainId: string,
  addresses: string[]
): Promise<boolean> => {
  const root = await fetchFromStorage<PersistedRoot>(PERSIST_ROOT_KEY).catch(() => null);
  if (!root) return false;

  if (chainKind === TempleChainKind.EVM) {
    const atomic = parseSlice(root.evmBalances)?.balancesAtomic ?? {};
    return addresses.some(address => hasPositiveEntry(atomic[address]?.[chainId]));
  }

  const atomic = parseSlice(root.balances)?.balancesAtomic ?? {};
  return addresses.some(address => hasPositiveEntry(atomic[`${address}_${chainId}`]?.data));
};
