import { Hex, getAddress, parseAbi, toFunctionSelector } from 'viem';

import { getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

const beaconAbi = parseAbi(['function implementation() view returns (address)']);

/** `bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`. */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
/** `bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)`. */
const EIP1967_BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';
const EIP1167_PREFIX = '363d3d373d3d3d363d73';
const EIP1167_SUFFIX = '5af43d82803e903d91602b57fd5bf3';

const SELECTORS = {
  balanceOf721: toFunctionSelector('function balanceOf(address owner) view returns (uint256)'),
  ownerOf: toFunctionSelector('function ownerOf(uint256 tokenId) view returns (address)'),
  tokenOfOwnerByIndex: toFunctionSelector(
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
  ),
  tokensOfOwner: toFunctionSelector('function tokensOfOwner(address owner) view returns (uint256[])'),
  walletOfOwner: toFunctionSelector('function walletOfOwner(address owner) view returns (uint256[])'),
  balanceOf1155: toFunctionSelector('function balanceOf(address account, uint256 id) view returns (uint256)'),
  balanceOfBatch: toFunctionSelector(
    'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
  )
};

export interface MethodPresence {
  balanceOf721: boolean;
  ownerOf: boolean;
  enumerable: boolean;
  tokensOfOwner: boolean;
  walletOfOwner: boolean;
  balanceOf1155: boolean;
  balanceOfBatch: boolean;
  /** Bytecode is a proxy, so the implementation's methods are requested too. */
  delegated: boolean;
}

export const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
};

export const wasAborted = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  return name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED';
};

const hasSelector = (bytecode: string, methodSelector: Hex) =>
  bytecode.toLowerCase().includes(methodSelector.slice(2).toLowerCase());

const addressFromWord = (word: string | undefined): HexString | null => {
  if (!word?.startsWith('0x') || word === '0x') return null;

  const address = `0x${word.slice(2).slice(-40).padStart(40, '0')}`;

  if (address === '0x0000000000000000000000000000000000000000') return null;

  try {
    return getAddress(address);
  } catch {
    return null;
  }
};

/** EIP-1167 clones embed the implementation address in the bytecode. */
const minimalProxyAddress = (bytecode: string): HexString | null => {
  const code = bytecode.toLowerCase().slice(2);
  const marker = code.indexOf(EIP1167_PREFIX);
  if (marker === -1) return null;

  const addressStart = marker + EIP1167_PREFIX.length;
  const suffix = code.slice(addressStart + 40, addressStart + 40 + EIP1167_SUFFIX.length);
  if (suffix !== EIP1167_SUFFIX) return null;

  return addressFromWord(`0x${code.slice(addressStart, addressStart + 40)}`);
};

const presenceFromBytecode = (bytecode: string): MethodPresence => ({
  balanceOf721: hasSelector(bytecode, SELECTORS.balanceOf721),
  ownerOf: hasSelector(bytecode, SELECTORS.ownerOf),
  enumerable: hasSelector(bytecode, SELECTORS.tokenOfOwnerByIndex),
  tokensOfOwner: hasSelector(bytecode, SELECTORS.tokensOfOwner),
  walletOfOwner: hasSelector(bytecode, SELECTORS.walletOfOwner),
  balanceOf1155: hasSelector(bytecode, SELECTORS.balanceOf1155),
  balanceOfBatch: hasSelector(bytecode, SELECTORS.balanceOfBatch),
  delegated: false
});

const hasVisibleMethod = (presence: MethodPresence) =>
  presence.ownerOf || presence.balanceOf721 || presence.balanceOf1155 || presence.balanceOfBatch;

const delegatedPresence = (): MethodPresence => ({
  balanceOf721: true,
  ownerOf: true,
  enumerable: false,
  tokensOfOwner: false,
  walletOfOwner: false,
  balanceOf1155: true,
  balanceOfBatch: true,
  delegated: true
});

interface BytecodeProbe {
  key: string;
  current: HexString;
  bytecode: Hex;
}

const readBytecode = async (network: EvmNetworkEssentials, address: HexString): Promise<Hex | null | 'failed'> => {
  try {
    const bytecode = await getViemPublicClient(network).getCode({ address });
    if (!bytecode || bytecode === '0x') return null;

    return bytecode;
  } catch (error) {
    if (wasAborted(error)) throw error;

    return 'failed';
  }
};

/**
 * EIP-1167 from bytecode, otherwise the EIP-1967 implementation slot.
 * A beacon proxy stores the beacon there; one multicall reads `implementation()` for every beacon.
 */
const readProxyImplementations = async (
  network: EvmNetworkEssentials,
  probes: readonly BytecodeProbe[],
  signal: AbortSignal
): Promise<(HexString | null)[]> => {
  const resolved: (HexString | null)[] = probes.map(probe => minimalProxyAddress(probe.bytecode));
  const missing = resolved.flatMap((address, index) => (address ? [] : [index]));
  if (!missing.length) return resolved;

  const client = getViemPublicClient(network);
  throwIfAborted(signal);
  const implementationWords = await Promise.all(
    missing.map(async index => {
      try {
        return await client.getStorageAt({ address: probes[index].current, slot: EIP1967_IMPLEMENTATION_SLOT });
      } catch (error) {
        if (wasAborted(error)) throw error;

        return undefined;
      }
    })
  );

  const needBeacon: number[] = [];
  missing.forEach((probeIndex, index) => {
    const implementation = addressFromWord(implementationWords[index]);
    if (implementation) resolved[probeIndex] = implementation;
    else needBeacon.push(probeIndex);
  });
  if (!needBeacon.length) return resolved;

  throwIfAborted(signal);
  const beaconWords = await Promise.all(
    needBeacon.map(async probeIndex => {
      try {
        return await client.getStorageAt({ address: probes[probeIndex].current, slot: EIP1967_BEACON_SLOT });
      } catch (error) {
        if (wasAborted(error)) throw error;

        return undefined;
      }
    })
  );

  const beaconCalls: { probeIndex: number; beacon: HexString }[] = [];
  needBeacon.forEach((probeIndex, index) => {
    const beacon = addressFromWord(beaconWords[index]);
    if (beacon) beaconCalls.push({ probeIndex, beacon });
  });
  if (!beaconCalls.length) return resolved;

  throwIfAborted(signal);
  try {
    const responses = await client.multicall({
      allowFailure: true,
      contracts: beaconCalls.map(({ beacon }) => ({
        address: beacon,
        abi: beaconAbi,
        functionName: 'implementation' as const
      }))
    });
    beaconCalls.forEach((call, index) => {
      const response = responses[index];
      if (response?.status !== 'success' || typeof response.result !== 'string') return;
      resolved[call.probeIndex] = addressFromWord(response.result);
    });
  } catch (error) {
    if (wasAborted(error)) throw error;
  }

  return resolved;
};

const followProxies = async (
  network: EvmNetworkEssentials,
  probes: readonly BytecodeProbe[],
  signal: AbortSignal
): Promise<{ probes: BytecodeProbe[]; failed: string[]; delegated: string[] }> => {
  const implementations = await readProxyImplementations(network, probes, signal);
  const codes = await Promise.all(
    implementations.map(address => (address ? readBytecode(network, address) : Promise.resolve(null)))
  );
  const next: BytecodeProbe[] = [];
  const failed: string[] = [];
  const delegated: string[] = [];

  probes.forEach((probe, index) => {
    const implementation = implementations[index];
    const bytecode = codes[index];
    if (bytecode === 'failed') {
      failed.push(probe.key);
      return;
    }
    if (!implementation || implementation.toLowerCase() === probe.current.toLowerCase() || !bytecode) {
      delegated.push(probe.key);
      return;
    }
    next.push({ key: probe.key, current: implementation, bytecode });
  });

  return { probes: next, failed, delegated };
};

/** Bytecode for every contract, then at most two proxy hops. Selectors come from the destination. */
export const readMethodPresenceForContracts = async (
  network: EvmNetworkEssentials,
  contracts: readonly HexString[],
  signal: AbortSignal
): Promise<{ presence: Map<string, MethodPresence | null>; failed: Set<string> }> => {
  const presence = new Map<string, MethodPresence | null>();
  const failed = new Set<string>();
  const codes = await Promise.all(contracts.map(contract => readBytecode(network, contract)));
  let pending: BytecodeProbe[] = [];

  contracts.forEach((contract, index) => {
    const bytecode = codes[index];
    const key = contract.toLowerCase();
    if (bytecode === 'failed') {
      failed.add(key);
      return;
    }
    if (!bytecode) {
      presence.set(key, null);
      return;
    }
    pending.push({ key, current: contract, bytecode });
  });

  for (let hop = 0; hop < 3 && pending.length; hop++) {
    const unresolved: BytecodeProbe[] = [];
    for (const probe of pending) {
      const found = presenceFromBytecode(probe.bytecode);
      if (hasVisibleMethod(found)) presence.set(probe.key, found);
      else unresolved.push(probe);
    }
    pending = unresolved;
    if (!pending.length || hop === 2) break;

    throwIfAborted(signal);
    const followed = await followProxies(network, pending, signal);
    throwIfAborted(signal);
    for (const key of followed.failed) failed.add(key);
    for (const key of followed.delegated) presence.set(key, delegatedPresence());
    pending = followed.probes;
  }

  for (const probe of pending) {
    if (!failed.has(probe.key) && !presence.has(probe.key)) presence.set(probe.key, delegatedPresence());
  }

  return { presence, failed };
};
