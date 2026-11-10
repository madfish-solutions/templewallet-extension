import { Hex, getAddress, parseAbi, toFunctionSelector } from 'viem';

import { equalsIgnoreCase } from 'lib/utils';
import { getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

/** A `balanceOf` above this is not treated as a complete enumerable list. */
const ENUMERATION_LIMIT = 128;

const erc721OwnershipAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokensOfOwner(address owner) view returns (uint256[])',
  'function walletOfOwner(address owner) view returns (uint256[])'
]);

const erc1155OwnershipAbi = parseAbi([
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
]);

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

export interface ChainOwnershipFacts {
  /** ERC-721 `balanceOf(account)`. Null for ERC-1155 and when the call did not return. */
  balanceOf: number | null;
  /** Token id -> the account owns it. A missing id means that call did not return. */
  perTokenOwned: ReadonlyMap<string, boolean>;
  /**
   * Token id -> quantity the account holds.
   * ERC-1155 is the balance the call returned. ERC-721 is `1` when `ownerOf` says this account owns it.
   */
  perTokenBalance: ReadonlyMap<string, string>;
  /**
   * Present when a list method returned `balanceOf` ids and none of those ids failed `ownerOf`.
   * An empty list is present when `balanceOf` is 0.
   */
  enumeratedTokenIds: readonly string[] | null;
}

interface ContractNftOwnershipQuery {
  contract: string;
  tokenIds: readonly string[];
}

interface ContractNftOwnershipRead {
  /** Lowercase contract address. Absent when that contract's bytecode read failed. */
  facts: ReadonlyMap<string, ChainOwnershipFacts>;
  /** Lowercase addresses whose bytecode read failed. Their reported token ids stay unverified. */
  failed: ReadonlySet<string>;
}

interface ContractCall {
  address: HexString;
  abi: typeof erc721OwnershipAbi | typeof erc1155OwnershipAbi;
  functionName: string;
  args: readonly unknown[];
}

interface MethodPresence {
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

const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
};

const wasAborted = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  return name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED';
};

const tokenIdKey = (tokenId: string) => {
  try {
    return BigInt(tokenId).toString();
  } catch {
    return null;
  }
};

const succeeded = (response: { status: string; result?: unknown } | undefined) =>
  response?.status === 'success' ? response.result : undefined;

const asBigint = (value: unknown) => (typeof value === 'bigint' ? value : null);

const asAddress = (value: unknown) => (typeof value === 'string' ? value : null);

const asBigintList = (value: unknown): readonly bigint[] | null =>
  Array.isArray(value) && value.every(item => typeof item === 'bigint') ? value : null;

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

interface CallResult {
  status: string;
  result?: unknown;
}

interface OwnershipTarget {
  key: string;
  contract: HexString;
  tokenIds: readonly string[];
}

interface BytecodeProbe {
  key: string;
  current: HexString;
  bytecode: Hex;
}

interface OwnershipPlan {
  key: string;
  contract: HexString;
  tokenIds: readonly string[];
  presence: MethodPresence | null;
  calls: ContractCall[];
  kind: 'none' | 'erc721' | 'erc1155';
  balanceAt: number;
  ownerAt: number;
  listAt: number;
  listCount: number;
  erc1155At: number;
  erc1155Batch: boolean;
}

interface InterpretedOwnership {
  facts: ChainOwnershipFacts;
  /** Set when `tokenOfOwnerByIndex` still has to be read for this balance. */
  enumerateBalance: number | null;
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
const readMethodPresenceForContracts = async (
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

const readMulticall = async (
  network: EvmNetworkEssentials,
  contracts: readonly ContractCall[]
): Promise<CallResult[]> => {
  if (!contracts.length) return [];

  const responses = await getViemPublicClient(network).multicall({ allowFailure: true, contracts });

  return responses.map(response => ({
    status: response.status,
    result: response.status === 'success' ? response.result : undefined
  }));
};

const emptyFacts = (): ChainOwnershipFacts => ({
  balanceOf: null,
  perTokenOwned: new Map(),
  perTokenBalance: new Map(),
  enumeratedTokenIds: null
});

const normalizeQueries = (queries: readonly ContractNftOwnershipQuery[]): OwnershipTarget[] => {
  const byContract = new Map<string, { contract: HexString; tokenIds: Set<string> }>();

  for (const query of queries) {
    let contract: HexString;
    try {
      contract = getAddress(query.contract);
    } catch {
      continue;
    }
    const key = contract.toLowerCase();
    const group = byContract.get(key) ?? { contract, tokenIds: new Set<string>() };
    for (const tokenId of query.tokenIds) {
      const normalized = tokenIdKey(tokenId);
      if (normalized) group.tokenIds.add(normalized);
    }
    byContract.set(key, group);
  }

  return Array.from(byContract, ([key, group]) => ({
    key,
    contract: group.contract,
    tokenIds: Array.from(group.tokenIds)
  }));
};

const planOwnershipCalls = (
  account: HexString,
  target: OwnershipTarget,
  presence: MethodPresence | null
): OwnershipPlan => {
  const plan: OwnershipPlan = {
    key: target.key,
    contract: target.contract,
    tokenIds: target.tokenIds,
    presence,
    calls: [],
    kind: 'none',
    balanceAt: -1,
    ownerAt: -1,
    listAt: 0,
    listCount: 0,
    erc1155At: 0,
    erc1155Batch: false
  };
  if (!presence) return plan;

  const erc721Ownership =
    presence.ownerOf ||
    presence.balanceOf721 ||
    presence.enumerable ||
    presence.tokensOfOwner ||
    presence.walletOfOwner;
  if (!presence.delegated && !erc721Ownership && (presence.balanceOf1155 || presence.balanceOfBatch))
    return planErc1155(plan, account, presence);

  return planErc721(plan, account, presence);
};

const planErc721 = (plan: OwnershipPlan, account: HexString, presence: MethodPresence): OwnershipPlan => {
  const { contract, tokenIds } = plan;
  if (presence.balanceOf721) {
    plan.balanceAt = plan.calls.length;
    plan.calls.push({ address: contract, abi: erc721OwnershipAbi, functionName: 'balanceOf', args: [account] });
  }
  if (presence.ownerOf) {
    plan.ownerAt = plan.calls.length;
    tokenIds.forEach(tokenId =>
      plan.calls.push({ address: contract, abi: erc721OwnershipAbi, functionName: 'ownerOf', args: [BigInt(tokenId)] })
    );
  }

  plan.listAt = plan.calls.length;
  if (presence.tokensOfOwner)
    plan.calls.push({ address: contract, abi: erc721OwnershipAbi, functionName: 'tokensOfOwner', args: [account] });
  if (presence.walletOfOwner)
    plan.calls.push({ address: contract, abi: erc721OwnershipAbi, functionName: 'walletOfOwner', args: [account] });
  plan.listCount = plan.calls.length - plan.listAt;
  plan.erc1155At = plan.calls.length;
  if (presence.delegated) pushErc1155Calls(plan.calls, contract, account, tokenIds);
  plan.erc1155Batch = presence.delegated && tokenIds.length > 0;
  plan.kind = 'erc721';

  return plan;
};

const planErc1155 = (plan: OwnershipPlan, account: HexString, presence: MethodPresence): OwnershipPlan => {
  const { contract, tokenIds } = plan;
  plan.erc1155Batch = presence.balanceOfBatch && tokenIds.length > 0;
  if (plan.erc1155Batch) {
    plan.calls.push({
      address: contract,
      abi: erc1155OwnershipAbi,
      functionName: 'balanceOfBatch',
      args: [tokenIds.map(() => account), tokenIds.map(tokenId => BigInt(tokenId))]
    });
  }
  if (presence.balanceOf1155) {
    tokenIds.forEach(tokenId =>
      plan.calls.push({
        address: contract,
        abi: erc1155OwnershipAbi,
        functionName: 'balanceOf',
        args: [account, BigInt(tokenId)]
      })
    );
  }
  plan.kind = 'erc1155';

  return plan;
};

const collectLists = (responses: readonly CallResult[], balanceOf: number | null): string[] => {
  const listed = new Set<string>();
  if (balanceOf == null) return [];

  for (const response of responses) {
    const ids = asBigintList(succeeded(response));
    if (!ids || ids.length !== balanceOf || listed.size === balanceOf) continue;
    ids.forEach(tokenId => listed.add(tokenId.toString()));
  }

  return Array.from(listed);
};

const completeList = (
  ids: readonly string[],
  balanceOf: number | null,
  perTokenOwned: ReadonlyMap<string, boolean>
): string[] | null => {
  if (balanceOf == null || balanceOf > ENUMERATION_LIMIT) return null;
  if (balanceOf === 0) return [];
  if (ids.length !== balanceOf) return null;
  if (ids.some(tokenId => perTokenOwned.get(tokenId) === false)) return null;

  return [...ids];
};

const interpretPlan = (
  account: HexString,
  plan: OwnershipPlan,
  responses: readonly CallResult[]
): InterpretedOwnership => {
  if (!plan.presence || plan.kind === 'none') return { facts: emptyFacts(), enumerateBalance: null };
  if (plan.kind === 'erc1155')
    return { facts: erc1155Facts(plan.tokenIds, responses, plan.erc1155Batch), enumerateBalance: null };

  return interpretErc721(account, plan, responses);
};

const interpretErc721 = (
  account: HexString,
  plan: OwnershipPlan,
  responses: readonly CallResult[]
): InterpretedOwnership => {
  const presence = plan.presence;
  if (!presence) return { facts: emptyFacts(), enumerateBalance: null };

  const balanceValue = plan.balanceAt === -1 ? null : asBigint(succeeded(responses[plan.balanceAt]));
  const balanceOf = balanceValue == null ? null : Number(balanceValue);
  const perTokenOwned = new Map<string, boolean>();
  const perTokenBalance = new Map<string, string>();
  let sawOwner = false;

  if (presence.ownerOf && plan.ownerAt !== -1) {
    plan.tokenIds.forEach((tokenId, index) => {
      const owner = asAddress(succeeded(responses[plan.ownerAt + index]));
      if (!owner) return;
      sawOwner = true;
      const owned = equalsIgnoreCase(owner, account);
      perTokenOwned.set(tokenId, owned);
      if (owned) perTokenBalance.set(tokenId, '1');
    });
  }

  if (presence.delegated && !sawOwner)
    return {
      facts: erc1155Facts(plan.tokenIds, responses.slice(plan.erc1155At), plan.erc1155Batch),
      enumerateBalance: null
    };

  const enumeratedTokenIds = completeList(
    collectLists(responses.slice(plan.listAt, plan.listAt + plan.listCount), balanceOf),
    balanceOf,
    perTokenOwned
  );
  for (const tokenId of enumeratedTokenIds ?? []) {
    if (perTokenOwned.get(tokenId) !== false) perTokenBalance.set(tokenId, '1');
  }
  const enumerateBalance =
    enumeratedTokenIds == null &&
    presence.enumerable &&
    balanceOf != null &&
    balanceOf > 0 &&
    balanceOf <= ENUMERATION_LIMIT
      ? balanceOf
      : null;

  return { facts: { balanceOf, perTokenOwned, perTokenBalance, enumeratedTokenIds }, enumerateBalance };
};

const fillEnumeration = async (
  network: EvmNetworkEssentials,
  account: HexString,
  pending: readonly { key: string; contract: HexString; balance: number }[],
  facts: Map<string, ChainOwnershipFacts>
) => {
  const calls: ContractCall[] = [];
  const spans = pending.map(item => {
    const start = calls.length;
    for (let index = 0; index < item.balance; index++) {
      calls.push({
        address: item.contract,
        abi: erc721OwnershipAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, BigInt(index)]
      });
    }

    return { ...item, start };
  });

  let responses: CallResult[];
  try {
    responses = await readMulticall(network, calls);
  } catch (error) {
    if (wasAborted(error)) throw error;
    console.error(error);

    return;
  }

  for (const span of spans) {
    const current = facts.get(span.key);
    if (!current) continue;

    const listed = new Set<string>();
    for (let index = 0; index < span.balance; index++) {
      const tokenId = asBigint(succeeded(responses[span.start + index]));
      if (tokenId != null) listed.add(tokenId.toString());
    }
    const ids = Array.from(listed);
    if (ids.length !== span.balance || ids.some(tokenId => current.perTokenOwned.get(tokenId) === false)) continue;
    const perTokenBalance = new Map(current.perTokenBalance);
    for (const tokenId of ids) {
      if (current.perTokenOwned.get(tokenId) !== false) perTokenBalance.set(tokenId, '1');
    }
    facts.set(span.key, { ...current, enumeratedTokenIds: ids, perTokenBalance });
  }
};

/**
 * Checks every contract together.
 * Bytecode is loaded in parallel, then one multicall reads the given token ids.
 * Enumerable indexes are a second multicall, and only for a balance that is known and at most 128.
 */
export const readContractNftOwnership = async (
  network: EvmNetworkEssentials,
  account: HexString,
  queries: readonly ContractNftOwnershipQuery[],
  signal: AbortSignal
): Promise<ContractNftOwnershipRead> => {
  const targets = normalizeQueries(queries);
  throwIfAborted(signal);
  const { presence, failed } = await readMethodPresenceForContracts(
    network,
    targets.map(target => target.contract),
    signal
  );
  throwIfAborted(signal);

  const plans = targets
    .filter(target => !failed.has(target.key))
    .map(target => planOwnershipCalls(account, target, presence.get(target.key) ?? null));
  const responses = await readMulticall(
    network,
    plans.flatMap(plan => plan.calls)
  );
  const facts = new Map<string, ChainOwnershipFacts>();
  const pending: { key: string; contract: HexString; balance: number }[] = [];
  let offset = 0;

  for (const plan of plans) {
    const interpreted = interpretPlan(account, plan, responses.slice(offset, offset + plan.calls.length));
    offset += plan.calls.length;
    facts.set(plan.key, interpreted.facts);
    if (interpreted.enumerateBalance != null)
      pending.push({ key: plan.key, contract: plan.contract, balance: interpreted.enumerateBalance });
  }

  if (pending.length) {
    throwIfAborted(signal);
    await fillEnumeration(network, account, pending, facts);
  }

  return { facts, failed };
};

const pushErc1155Calls = (
  calls: ContractCall[],
  contract: HexString,
  account: HexString,
  tokenIds: readonly string[]
) => {
  if (!tokenIds.length) return;

  calls.push({
    address: contract,
    abi: erc1155OwnershipAbi,
    functionName: 'balanceOfBatch',
    args: [tokenIds.map(() => account), tokenIds.map(tokenId => BigInt(tokenId))]
  });
  tokenIds.forEach(tokenId =>
    calls.push({
      address: contract,
      abi: erc1155OwnershipAbi,
      functionName: 'balanceOf',
      args: [account, BigInt(tokenId)]
    })
  );
};

const erc1155Facts = (
  tokenIds: readonly string[],
  responses: readonly { status: string; result?: unknown }[],
  batchFirst: boolean
): ChainOwnershipFacts => {
  const batch = batchFirst ? asBigintList(succeeded(responses[0])) : null;
  const perTokenOwned = new Map<string, boolean>();
  const perTokenBalance = new Map<string, string>();

  tokenIds.forEach((tokenId, index) => {
    const balance = batch?.[index] ?? asBigint(succeeded(responses[(batchFirst ? 1 : 0) + index]));
    if (balance == null) return;
    perTokenOwned.set(tokenId, balance > 0n);
    perTokenBalance.set(tokenId, balance.toString());
  });

  return { balanceOf: null, perTokenOwned, perTokenBalance, enumeratedTokenIds: null };
};
