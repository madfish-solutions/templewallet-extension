import { EntrypointsResponse, RpcClient } from '@taquito/rpc';
import debounce from 'debounce';
import memoize from 'p-memoize';

interface RPCOptions {
  block: string;
}

interface CachedEntrypointsItem {
  key: string;
  entrypoints: EntrypointsResponse;
}

export class FastRpcClient extends RpcClient {
  refreshInterval = 10_000; // 10 sec
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

  getBalanceMemo = memoize(super.getBalance.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getLiveBlocks(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getLiveBlocksMemo(opts);
  }

  getLiveBlocksMemo = memoize(super.getLiveBlocks.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge
  });

  async getStorage(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getStorageMemo(address, opts);
  }

  getStorageMemo = memoize(super.getStorage.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getScript(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getScriptMemo(address, opts);
  }

  getScriptMemo = memoize(super.getScript.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getContract(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getContractMemo(address, opts);
  }

  getContractMemo = memoize(super.getContract.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
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

  getEntrypointsMemo = memoize(super.getEntrypoints.bind(this), {
    cacheKey: ([contract, opts]) => [contract, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
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

  getManagerKeyMemo = memoize(super.getManagerKey.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getDelegate(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getDelegateMemo(address, opts);
  }

  getDelegateMemo = memoize(super.getDelegate.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getBigMapExpr(id: string, expr: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBigMapExprMemo(id, expr, opts);
  }

  getBigMapExprMemo = memoize(super.getBigMapExpr.bind(this), {
    cacheKey: ([id, expr, opts]) => [id, expr, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getDelegates(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getDelegatesMemo(address, opts);
  }

  getDelegatesMemo = memoize(super.getDelegates.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(''),
    maxAge: this.memoizeMaxAge
  });

  async getConstants(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getConstantsMemo(opts);
  }

  getConstantsMemo = memoize(super.getConstants.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge
  });

  async getBlock(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockMemo(opts);
  }

  getBlockMemo = memoize(super.getBlock.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge
  });

  async getBlockHeader(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockHeaderMemo(opts);
  }

  getBlockHeaderMemo = memoize(super.getBlockHeader.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge
  });

  async getBlockMetadata(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockMetadataMemo(opts);
  }

  getBlockMetadataMemo = memoize(super.getBlockMetadata.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
    maxAge: this.memoizeMaxAge
  });

  getChainId = memoize(super.getChainId.bind(this));

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
