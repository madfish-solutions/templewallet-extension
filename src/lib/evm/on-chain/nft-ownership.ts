import { getAddress, parseAbi } from 'viem';

import { equalsIgnoreCase } from 'lib/utils';
import { getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { MethodPresence, readMethodPresenceForContracts, throwIfAborted, wasAborted } from './nft-ownership-bytecode';

/** A `balanceOf` above this is not treated as a complete enumerable list. */
const ENUMERATION_LIMIT = 128;
/** Calls per multicall. A long token list is split so one payload stays within RPC limits. */
const MULTICALL_CHUNK = 80;

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

interface CallResult {
  status: string;
  result?: unknown;
}

interface OwnershipTarget {
  key: string;
  contract: HexString;
  tokenIds: readonly string[];
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

const readMulticall = async (
  network: EvmNetworkEssentials,
  contracts: readonly ContractCall[],
  signal: AbortSignal
): Promise<CallResult[]> => {
  if (!contracts.length) return [];

  const client = getViemPublicClient(network);
  const results: CallResult[] = [];

  for (let index = 0; index < contracts.length; index += MULTICALL_CHUNK) {
    throwIfAborted(signal);
    const responses = await client.multicall({
      allowFailure: true,
      contracts: contracts.slice(index, index + MULTICALL_CHUNK)
    });

    for (const response of responses) {
      results.push({
        status: response.status,
        result: response.status === 'success' ? response.result : undefined
      });
    }
  }

  return results;
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
  facts: Map<string, ChainOwnershipFacts>,
  signal: AbortSignal
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
    responses = await readMulticall(network, calls, signal);
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
 * Bytecode is loaded in parallel, then the given token ids are read together.
 * A long call list is split into multicalls of at most 80. Enumerable indexes are a follow-up,
 * and only for a balance that is known and at most 128.
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
    plans.flatMap(plan => plan.calls),
    signal
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
    await fillEnumeration(network, account, pending, facts, signal);
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
