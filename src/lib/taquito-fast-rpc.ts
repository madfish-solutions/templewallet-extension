import { RpcClient } from "@taquito/rpc";
import memoize from "mem";
import debouncePromise from "p-debounce";

const DEFAULT_REFRESH_INTERVAL = 20_000;

interface RPCOptions {
  block: string;
}

export class FastRpcClient extends RpcClient {
  refreshInterval = DEFAULT_REFRESH_INTERVAL;

  private latestBlock?: {
    hash: string;
    refreshedAt: number; // timestamp
  };

  async getBlockHash(opts?: RPCOptions) {
    await this.loadLatestBlock(opts);

    if (wantsHead(opts) && this.latestBlock) {
      return this.latestBlock.hash;
    }
    return this.getBlockHashPure(opts);
  }

  async getBalance(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBalanceMemo(address, opts);
  }

  getBalanceMemo = memoize(super.getBalance.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getLiveBlocks(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getLiveBlocksMemo(opts);
  }

  getLiveBlocksMemo = memoize(super.getLiveBlocks.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
  });

  async getStorage(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getStorageMemo(address, opts);
  }

  getStorageMemo = memoize(super.getStorage.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getScript(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getScriptMemo(address, opts);
  }

  getScriptMemo = memoize(super.getScript.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getContract(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getContractMemo(address, opts);
  }

  getContractMemo = memoize(super.getContract.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getEntrypoints(contract: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getEntrypointsMemo(contract, opts);
  }

  getEntrypointsMemo = memoize(super.getEntrypoints.bind(this), {
    cacheKey: ([contract, opts]) => [contract, toOptsKey(opts)].join(""),
  });

  async getManagerKey(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getManagerKeyMemo(address, opts);
  }

  getManagerKeyMemo = memoize(super.getManagerKey.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getDelegate(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getDelegateMemo(address, opts);
  }

  getDelegateMemo = memoize(super.getDelegate.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getBigMapExpr(id: string, expr: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBigMapExprMemo(id, expr, opts);
  }

  getBigMapExprMemo = memoize(super.getBigMapExpr.bind(this), {
    cacheKey: ([id, expr, opts]) => [id, expr, toOptsKey(opts)].join(""),
  });

  async getDelegates(address: string, opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getDelegatesMemo(address, opts);
  }

  getDelegatesMemo = memoize(super.getDelegates.bind(this), {
    cacheKey: ([address, opts]) => [address, toOptsKey(opts)].join(""),
  });

  async getConstants(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getConstantsMemo(opts);
  }

  getConstantsMemo = memoize(super.getConstants.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
  });

  async getBlock(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockMemo(opts);
  }

  getBlockMemo = memoize(super.getBlock.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
  });

  async getBlockHeader(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockHeaderMemo(opts);
  }

  getBlockHeaderMemo = memoize(super.getBlockHeader.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
  });

  async getBlockMetadata(opts?: RPCOptions) {
    opts = await this.loadLatestBlock(opts);
    return this.getBlockMetadataMemo(opts);
  }

  getBlockMetadataMemo = memoize(super.getBlockMetadata.bind(this), {
    cacheKey: ([opts]) => toOptsKey(opts),
  });

  getChainId = memoize(super.getChainId.bind(this));

  private async loadLatestBlock(opts?: RPCOptions) {
    const head = wantsHead(opts);
    if (!head) return opts;

    if (
      !this.latestBlock ||
      Date.now() - this.latestBlock.refreshedAt > DEFAULT_REFRESH_INTERVAL
    ) {
      const hash = await this.getBlockHashPure();
      this.latestBlock = { hash, refreshedAt: Date.now() };
    }

    return { block: this.latestBlock.hash };
  }

  private getBlockHashPure = debouncePromise(
    super.getBlockHash.bind(this),
    500
  );
}

function wantsHead(opts?: RPCOptions) {
  return !opts?.block || opts.block === "head";
}

function toOptsKey(opts?: RPCOptions) {
  return opts?.block ?? "head";
}
