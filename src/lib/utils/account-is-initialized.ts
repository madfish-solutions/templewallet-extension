import { fetchEvmAccountInitialized } from 'lib/apis/temple/endpoints/evm';
import { TzktAccountType, getAccountStatsFromTzkt } from 'lib/apis/tzkt';
import { TempleTezosChainId } from 'lib/temple/types';

const existentAccountTypes = [TzktAccountType.Contract, TzktAccountType.Delegate, TzktAccountType.User];

const fetchInitialized = (fn: (address: string) => Promise<{ isInitialized: boolean }>, address?: string) =>
  address
    ? fn(address)
        .then(res => res.isInitialized)
        .catch(() => undefined)
    : Promise.resolve(false);
const fetchTezosInitialized = (chainId: TempleTezosChainId, address?: string) =>
  fetchInitialized(
    address =>
      getAccountStatsFromTzkt(address, chainId).then(({ type }) => ({
        isInitialized: existentAccountTypes.includes(type)
      })),
    address
  );

export const accountIsInitialized = async (tezosAddress?: string, evmAddress?: string) => {
  const networksInitializationFlags = await Promise.all([
    fetchTezosInitialized(TempleTezosChainId.Mainnet, tezosAddress),
    fetchTezosInitialized(TempleTezosChainId.Dcp, tezosAddress),
    fetchInitialized(fetchEvmAccountInitialized, evmAddress)
  ]);

  if (networksInitializationFlags.some(Boolean)) {
    return true;
  }

  const [tezosMainnetInitialized, , evmInitialized] = networksInitializationFlags;

  return [tezosMainnetInitialized, evmInitialized].some(flag => flag === undefined) ? undefined : false;
};
