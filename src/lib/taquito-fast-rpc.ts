import { EntrypointsResponse, RpcClient } from '@taquito/rpc';
import debounce from 'debounce';
import memoizee from 'memoizee';

interface RPCOptions {
  block: string;
}

interface CachedEntrypointsItem {
  key: string;
  entrypoints: EntrypointsResponse;
}

export class FastRpcClient extends RpcClient {
  refreshInterval = 5_000; // 5 sec
  memoizeMaxAge = 180_000; // 3 min

  private latestBlock?: {
    hash: string;
    refreshedAt: number; // timestamp
  };

  async getBlockHash(opts?: RPCOptions) {
    await this.loadLatestBlock(opts);

    if (wantsHead(opts) && this.latestBlock) {
      return this.latestBlock.hash;
    }
    return super.getBlockHash(opts);
  }

  async getBalance(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBalanceMemo(address, opts);
  }

  getBalanceMemo = memoizee(super.getBalance.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getLiveBlocks(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getLiveBlocksMemo(opts);
  }

  getLiveBlocksMemo = memoizee(super.getLiveBlocks.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getStorage(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getStorageMemo(address, opts);
  }

  getStorageMemo = memoizee(super.getStorage.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getScript(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getScriptMemo(address, opts);
  }

  getScriptMemo = memoizee(super.getScript.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getContract(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getContractMemo(address, opts);
  }

  getContractMemo = memoizee(super.getContract.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  // <Entrypoints>

  async getEntrypoints(contract: string, opts?: RPCOptions): Promise<EntrypointsResponse> {
    const chainID = await this.getChainId();
    const cacheKey = `${chainID}:${contract}`;

    const cached = this.getCachedEntrypoints(cacheKey);
    if (cached) return cached;

    opts = await this.loadLatestBlock(opts);
    const result = await this.getEntrypointsMemo(contract, opts);

    this.setCachedEntrypoints(cacheKey, result);

    return result;
  }

  getEntrypointsMemo = memoizee(super.getEntrypoints.bind(this), {
    normalizer: ([contract, opts]) => [contract, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  private ENTRYPOINTS_CACHE_KEY = 'FastRpcClient.cachedEntrypoints';
  private ENTRYPOINTS_CACHE_SIZE = 30;
  private cachedEntrypoints = this.readCachedEntrypoints();

  private readCachedEntrypoints(): CachedEntrypointsItem[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const cache = localStorage.getItem(this.ENTRYPOINTS_CACHE_KEY);
      return cache ? JSON.parse(cache) : [];
    } catch (error) {
      console.error(error);
    }
    return [];
  }

  private commitCachedEntrypoints = debounce(() => {
    if (typeof localStorage === 'undefined') return;
    this.cachedEntrypoints = this.cachedEntrypoints.slice(0, this.ENTRYPOINTS_CACHE_SIZE * 3);

    try {
      localStorage.setItem(
        this.ENTRYPOINTS_CACHE_KEY,
        JSON.stringify(this.cachedEntrypoints.slice(0, this.ENTRYPOINTS_CACHE_SIZE))
      );
    } catch (error) {
      console.error(error);
    }
  }, 2_000);

  private getCachedEntrypoints(key: string): EntrypointsResponse | undefined {
    const index = this.cachedEntrypoints.findIndex(item => item.key === key);
    const item = this.cachedEntrypoints[index];

    // Moving used caches to the head of the list
    if (index > 0) {
      this.cachedEntrypoints.splice(index, 1);
      this.cachedEntrypoints.unshift(item!);

      this.commitCachedEntrypoints();
    }

    return item?.entrypoints;
  }

  private setCachedEntrypoints(key: string, entrypoints: EntrypointsResponse) {
    const index = this.cachedEntrypoints.findIndex(item => item.key === key);

    // Moving used caches to the head of the list
    if (index >= 0) this.cachedEntrypoints.splice(index, 1);
    this.cachedEntrypoints.unshift({ key, entrypoints });

    this.commitCachedEntrypoints();
  }

  // </Entrypoints>

  async getManagerKey(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getManagerKeyMemo(address, opts);
  }

  getManagerKeyMemo = memoizee(super.getManagerKey.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getDelegate(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getDelegateMemo(address, opts);
  }

  getDelegateMemo = memoizee(super.getDelegate.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getBigMapExpr(id: string, expr: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBigMapExprMemo(id, expr, opts);
  }

  getBigMapExprMemo = memoizee(super.getBigMapExpr.bind(this), {
    normalizer: ([id, expr, opts]) => [id, expr, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getDelegates(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getDelegatesMemo(address, opts);
  }

  getDelegatesMemo = memoizee(super.getDelegates.bind(this), {
    normalizer: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getConstants(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getConstantsMemo(opts);
  }

  getConstantsMemo = memoizee(super.getConstants.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getBlock(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockMemo(opts);
  }

  getBlockMemo = memoizee(super.getBlock.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getBlockHeader(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockHeaderMemo(opts);
  }

  getBlockHeaderMemo = memoizee(super.getBlockHeader.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  async getBlockMetadata(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockMetadataMemo(opts);
  }

  getBlockMetadataMemo = memoizee(super.getBlockMetadata.bind(this), {
    normalizer: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge,
    promise: true
  });

  getChainId = memoizee(super.getChainId.bind(this), { promise: true });

  private async loadLatestBlock(opts?: RPCOptions) {
    const head = wantsHead(opts);
    if (!head) return opts;

    await this.refreshLatestBlock();
    return { block: this.latestBlock!.hash };
  }

  private refreshLatestBlock = onlyOncePerExec(async () => {
    if (!this.latestBlock || Date.now() - this.latestBlock.refreshedAt > this.refreshInterval) {
      const hash = await super.getBlockHash();
      this.latestBlock = { hash, refreshedAt: Date.now() };
    }
  });
}

function wantsHead(opts?: RPCOptions) {
  return !opts?.block || opts.block === 'head';
}

function toOptsKey(opts?: RPCOptions) {
  return opts?.block ?? 'head';
}

function onlyOncePerExec<T>(factory: () => Promise<T>) {
  let worker: Promise<T> | null = null;

  return () =>
    worker ??
    (worker = factory().finally(() => {
      worker = null;
    }));
}
