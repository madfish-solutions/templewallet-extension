import { EntrypointsResponse, RpcClient, RPCOptions } from '@taquito/rpc';
import retry from 'async-retry';
import memoizee from 'memoizee';

import { makeCachedChainIdKey, getCachedChainId, setCachedChainId } from './chain-ids-cache';
import { getCachedEntrypoints, setCachedEntrypoints } from './entrypoints-cache';

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
 * Memoization of requests is then based on the value of that block hash.
 *
 * Thus, block hash is updated frequently, and other requests are memoized for
 * block life time +- provided TTL. This strategy further reduces the number of
 * requests made within block life time.
 *
 * Additionally, persisting chain IDs and contracts' entrypoints data.
 */
export class FastRpcClient extends RpcClient {
  private latestBlock?: LatestBlock;

  async getChainId() {
    const cacheKey = makeCachedChainIdKey(this.url, this.chain);

    const cached = getCachedChainId(cacheKey);
    if (cached) return cached;

    const result = await this.getChainIdMemo();
    setCachedChainId(cacheKey, result);

    return result;
  }

  /** Cache storage (localStorage) is not available in BG worker. */
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
    opts = await this.withLatestBlock(opts);
    return this.getBalanceMemo(address, opts);
  }

  getBalanceMemo = memoizee(super.getBalance.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getLiveBlocks(opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getLiveBlocksMemo(opts);
  }

  getLiveBlocksMemo = memoizee(super.getLiveBlocks.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getStorage(address: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getStorageMemo(address, opts);
  }

  getStorageMemo = memoizee(super.getStorage.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getScript(address: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getScriptMemo(address, opts);
  }

  getScriptMemo = memoizee(super.getScript.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getContract(address: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getContractMemo(address, opts);
  }

  getContractMemo = memoizee(super.getContract.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getProtocols(opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getProtocolsMemo(opts);
  }

  getProtocolsMemo = memoizee(super.getProtocols.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getEntrypoints(contract: string, opts?: RPCOptions): Promise<EntrypointsResponse> {
    const chainID = await this.getChainId();
    const cacheKey = `${chainID}:${contract}`;

    const cached = getCachedEntrypoints(cacheKey);
    if (cached) return cached;

    opts = await this.withLatestBlock(opts);
    const result = await super.getEntrypoints(contract, opts);

    setCachedEntrypoints(cacheKey, result);

    return result;
  }

  async getManagerKey(address: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getManagerKeyMemo(address, opts);
  }

  getManagerKeyMemo = memoizee(super.getManagerKey.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getDelegate(address: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getDelegateMemo(address, opts);
  }

  getDelegateMemo = memoizee(super.getDelegate.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBigMapExpr(id: string, expr: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getBigMapExprMemo(id, expr, opts);
  }

  getBigMapExprMemo = memoizee(super.getBigMapExpr.bind(this), {
    normalizer: ([id, expr, opts]) => `${id}${expr}${toOptsKey(opts)}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getDelegates(address: string, opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getDelegatesMemo(address, opts);
  }

  getDelegatesMemo = memoizee(super.getDelegates.bind(this), {
    normalizer: ([address, opts]) => `${toOptsKey(opts)}${address}`,
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getConstants(opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getConstantsMemo(opts);
  }

  getConstantsMemo = memoizee(super.getConstants.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlock(opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getBlockMemo(opts);
  }

  getBlockMemo = memoizee(super.getBlock.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlockHeader(opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getBlockHeaderMemo(opts);
  }

  getBlockHeaderMemo = memoizee(super.getBlockHeader.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  async getBlockMetadata(opts?: RPCOptions) {
    opts = await this.withLatestBlock(opts);
    return this.getBlockMetadataMemo(await this.withLatestBlock(opts));
  }

  getBlockMetadataMemo = memoizee(super.getBlockMetadata.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: MEMOIZE_MAX_AGE,
    promise: true
  });

  private async withLatestBlock(opts?: RPCOptions): Promise<RPCOptions | undefined> {
    if (!wantsHead(opts)) return opts;

    const { hash } = await this.loadLatestBlock();

    return { ...opts, block: hash };
  }

  private loadLatestBlock = onlyOncePerExec(async () => {
    if (!this.latestBlock || Date.now() - this.latestBlock.refreshedAt > BLOCK_REFRESH_MIN_INTERVAL) {
      const hash = await super.getBlockHash();
      this.latestBlock = { hash, refreshedAt: Date.now() };
    }

    return this.latestBlock;
  });
}

function wantsHead(opts?: RPCOptions) {
  return !opts?.block || opts.block === 'head';
}

function toOptsKey(opts?: RPCOptions) {
  if (!opts) return 'head';

  let key = opts.block;

  if (opts.version != null) key += opts.version;

  return key;
}

function onlyOncePerExec<T>(factory: () => Promise<T>) {
  let worker: Promise<T> | null = null;

  return () =>
    worker ??
    (worker = factory().finally(() => {
      worker = null;
    }));
}
