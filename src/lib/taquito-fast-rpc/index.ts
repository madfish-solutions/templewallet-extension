import { EntrypointsResponse, RpcClient, RPCOptions } from '@taquito/rpc';
import retry from 'async-retry';
import memoizee from 'memoizee';

import { makeCachedChainIdKey, getCachedChainId, setCachedChainId } from './chain-ids-cache';
import { getCachedEntrypoints, setCachedEntrypoints } from './entrypoints-cache';
import { TempleHttpBackend } from './http-backend';

interface LatestBlock {
  hash: string;
  /** timestamp */
  refreshedAt: number;
}

/** 1 sec */
const BLOCK_REFRESH_MIN_INTERVAL = 1_000;

/** 1.5 min */
const MEMOIZE_MAX_AGE = 90_000;

/**
 * Alternative to Taquito's `RpcClientCache`.
 *
 * Different in a way that TTL (same default - 1 second) is set only to one piece of data - head block hash.
 * Memoization of requests is then based on the value of that block hash, while the requests themselves
 * stay addressed by `head`: some nodes serve hash-addressed reads orders of magnitude slower. A value
 * memoized under a hash may therefore come from the head that followed it, which is fresher, never staler.
 *
 * Thus, block hash is updated frequently, and other requests are memoized for
 * block life time +- provided TTL. This strategy further reduces the number of
 * requests made within block life time.
 *
 * Additionally, persisting chain IDs and contracts' entrypoints data.
 */
export class FastRpcClient extends RpcClient {
  private latestBlock?: LatestBlock;

  constructor(url: string, chain?: string) {
    super(url, chain, new TempleHttpBackend());
  }

  // Reads are memoized under the head hash, so forgetting the hash invalidates them all; Taquito also calls this after injecting
  deleteAllCachedData() {
    this.latestBlock = undefined;
  }

  async getChainId() {
    const cacheKey = makeCachedChainIdKey(this.url, this.chain);

    const cached = getCachedChainId(cacheKey);
    if (cached) return cached;

    const result = await this.getChainIdMemo();
    setCachedChainId(cacheKey, result);

    return result;
  }

  /**
   * Cache storage (localStorage) is not available in BG worker.
   * TODO: Consider switching storage.
   */
  getChainIdMemo = memoizee(() => retry(() => super.getChainId(), { retries: 2 }), {
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlockHash(opts?: RPCOptions) {
    if (wantsHead(opts)) {
      const { hash } = await this.loadLatestBlock();

      return hash;
    }

    return super.getBlockHash(opts);
  }

  async getBalance(address: string, opts?: RPCOptions) {
    return this.getBalanceMemo(address, opts, await this.getMemoKey(opts));
  }

  getBalanceMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getBalance(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getLiveBlocks(opts?: RPCOptions) {
    return this.getLiveBlocksMemo(opts, await this.getMemoKey(opts));
  }

  getLiveBlocksMemo = memoizee((opts: RPCOptions | undefined, _memoKey: string) => super.getLiveBlocks(opts), {
    normalizer: ([, memoKey]) => memoKey,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getStorage(address: string, opts?: RPCOptions) {
    return this.getStorageMemo(address, opts, await this.getMemoKey(opts));
  }

  getStorageMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getStorage(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getScript(address: string, opts?: RPCOptions) {
    return this.getScriptMemo(address, opts, await this.getMemoKey(opts));
  }

  getScriptMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getScript(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getContract(address: string, opts?: RPCOptions) {
    return this.getContractMemo(address, opts, await this.getMemoKey(opts));
  }

  getContractMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getContract(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getProtocols(opts?: RPCOptions) {
    return this.getProtocolsMemo(opts, await this.getMemoKey(opts));
  }

  getProtocolsMemo = memoizee((opts: RPCOptions | undefined, _memoKey: string) => super.getProtocols(opts), {
    normalizer: ([, memoKey]) => memoKey,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getEntrypoints(contract: string, opts?: RPCOptions): Promise<EntrypointsResponse> {
    const chainID = await this.getChainId();
    const cacheKey = `${chainID}:${contract}`;

    const cached = getCachedEntrypoints(cacheKey);
    if (cached) return cached;

    const result = await super.getEntrypoints(contract, opts);

    setCachedEntrypoints(cacheKey, result);

    return result;
  }

  async getManagerKey(address: string, opts?: RPCOptions) {
    return this.getManagerKeyMemo(address, opts, await this.getMemoKey(opts));
  }

  getManagerKeyMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getManagerKey(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getDelegate(address: string, opts?: RPCOptions) {
    return this.getDelegateMemo(address, opts, await this.getMemoKey(opts));
  }

  getDelegateMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getDelegate(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getDelegateActiveStakingParameters(bakerPkh: string, opts?: RPCOptions) {
    const block = opts?.block ?? 'head';

    return this.httpBackend.createRequest<DelegateActiveStakingParameters | nullish>({
      url: this.createURL(
        `/chains/${this.chain}/blocks/${block}/context/delegates/${bakerPkh}/active_staking_parameters`
      ),
      method: 'GET'
    });
  }

  async getDelegateLimitOfStakingOverBakingIsPositive(bakerPkh: string, opts?: RPCOptions) {
    const params = await this.getDelegateActiveStakingParameters(bakerPkh, opts);
    if (!params) return false;

    for (const [key, val] of Object.entries(params)) {
      if (key.startsWith('limit_of_staking_over_baking')) return !val;
    }

    return false;
  }

  async getBigMapExpr(id: string, expr: string, opts?: RPCOptions) {
    return this.getBigMapExprMemo(id, expr, opts, await this.getMemoKey(opts));
  }

  getBigMapExprMemo = memoizee(
    (id: string, expr: string, opts: RPCOptions | undefined, _memoKey: string) => super.getBigMapExpr(id, expr, opts),
    {
      normalizer: ([id, expr, , memoKey]) => `${id}${expr}${memoKey}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getDelegates(address: string, opts?: RPCOptions) {
    return this.getDelegatesMemo(address, opts, await this.getMemoKey(opts));
  }

  getDelegatesMemo = memoizee(
    (address: string, opts: RPCOptions | undefined, _memoKey: string) => super.getDelegates(address, opts),
    {
      normalizer: ([address, , memoKey]) => `${memoKey}${address}`,
      maxAge: MEMOIZE_MAX_AGE,
      promise: true
    }
  );

  async getConstants(opts?: RPCOptions) {
    return this.getConstantsMemo(opts, await this.getMemoKey(opts));
  }

  getConstantsMemo = memoizee((opts: RPCOptions | undefined, _memoKey: string) => super.getConstants(opts), {
    normalizer: ([, memoKey]) => memoKey,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlock(opts?: RPCOptions) {
    return this.getBlockMemo(opts, await this.getMemoKey(opts));
  }

  getBlockMemo = memoizee((opts: RPCOptions | undefined, _memoKey: string) => super.getBlock(opts), {
    normalizer: ([, memoKey]) => memoKey,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlockHeader(opts?: RPCOptions) {
    return this.getBlockHeaderMemo(opts, await this.getMemoKey(opts));
  }

  getBlockHeaderMemo = memoizee((opts: RPCOptions | undefined, _memoKey: string) => super.getBlockHeader(opts), {
    normalizer: ([, memoKey]) => memoKey,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlockMetadata(opts?: RPCOptions) {
    return this.getBlockMetadataMemo(opts, await this.getMemoKey(opts));
  }

  getBlockMetadataMemo = memoizee((opts: RPCOptions | undefined, _memoKey: string) => super.getBlockMetadata(opts), {
    normalizer: ([, memoKey]) => memoKey,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  private async getMemoKey(opts?: RPCOptions) {
    const block = wantsHead(opts) ? (await this.loadLatestBlock()).hash : opts?.block;

    return `${block}${opts?.version ?? ''}`;
  }

  private loadLatestBlock = onlyOncePerExec(async () => {
    const newRefreshedAt = Date.now();
    if (!this.latestBlock || newRefreshedAt - this.latestBlock.refreshedAt > BLOCK_REFRESH_MIN_INTERVAL) {
      const hash = await super.getBlockHash();
      this.latestBlock = { hash, refreshedAt: newRefreshedAt };
    }

    return this.latestBlock;
  });
}

function wantsHead(opts?: RPCOptions) {
  return !opts?.block || opts.block === 'head';
}

function onlyOncePerExec<T>(factory: () => Promise<T>) {
  let worker: Promise<T> | null = null;

  return () =>
    worker ??
    (worker = factory().finally(() => {
      worker = null;
    }));
}

/**
 * Whitnessed `string` tail to be
 * - `_millionth`
 * - `_billionth`
 */
type DelegateActiveStakingParameters = {
  [key in `edge_of_baking_over_staking${string}` | `limit_of_staking_over_baking${string}`]: number | nullish;
};
