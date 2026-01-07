import { isDefined } from '@rnw-community/shared';
import { HttpResponseError } from '@taquito/http-utils';
import {
  AllDelegatesQueryArguments,
  AttestationRightsQueryArguments,
  BakingRightsQueryArguments,
  EntrypointsResponse,
  ForgeOperationsParams,
  PackDataParams,
  PendingOperationsQueryArguments,
  PreapplyParams,
  RpcClient,
  RPCOptions,
  RPCRunCodeParam,
  RPCRunScriptViewParam,
  RPCRunViewParam,
  RPCSimulateOperationParam,
  TicketTokenParams,
  UnparsingMode
} from '@taquito/rpc';
import { TezosOperationError } from '@taquito/taquito';

import { getTezosFastRpcClient } from 'temple/tezos/utils';

import { FastRpcClient } from '../taquito-fast-rpc';

/**
 * A lightweight fallback client that sequentially tries multiple FastRpcClient instances
 * until one succeeds. Inspired by Viem's fallback transport policy.
 */
export class FallbackRpcClient extends RpcClient {
  private readonly clients: FastRpcClient[];
  private preferredIndex: number = 0;

  constructor(urls: string[]) {
    super(urls[0]);
    this.clients = urls.map(url => getTezosFastRpcClient(url));
  }

  private async callWithFallback<T>(method: (client: FastRpcClient) => Promise<T>): Promise<T> {
    const total = this.clients.length;
    const start = this.preferredIndex % total;

    for (let i = 0; i < total; i++) {
      const idx = (start + i) % total;
      const client = this.clients[idx];
      try {
        const result = await method(client);
        this.preferredIndex = idx;
        return result;
      } catch (err: any) {
        if (!shouldFallbackToNext(err) || i === total - 1) throw err;
      }
    }

    // Should be unreachable
    throw new Error('FallbackRpcClient: no RPCs available');
  }

  getRpcUrl() {
    const total = this.clients.length;
    const idx = this.preferredIndex % total;
    return this.clients[idx].getRpcUrl();
  }

  async getChainId() {
    return this.callWithFallback(client => client.getChainId());
  }

  async getBlockHash(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBlockHash(opts));
  }

  async getBalance(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBalance(address, opts));
  }

  async getLiveBlocks(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getLiveBlocks(opts));
  }

  async getStorage(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getStorage(address, opts));
  }

  async getSpendable(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getSpendable(address, opts));
  }

  async getBalanceAndFrozenBonds(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBalanceAndFrozenBonds(address, opts));
  }

  async getSpendableAndFrozenBonds(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getSpendableAndFrozenBonds(address, opts));
  }

  async getFullBalance(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getFullBalance(address, opts));
  }

  async getScript(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getScript(address, opts));
  }

  async getNormalizedScript(address: string, unparsingMode?: UnparsingMode, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getNormalizedScript(address, unparsingMode, opts));
  }

  async getContract(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getContract(address, opts));
  }

  async getProtocols(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getProtocols(opts));
  }

  async getEntrypoints(contract: string, opts?: RPCOptions): Promise<EntrypointsResponse> {
    return this.callWithFallback(client => client.getEntrypoints(contract, opts));
  }

  async getManagerKey(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getManagerKey(address, opts));
  }

  async getDelegate(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getDelegate(address, opts));
  }

  async getDelegateActiveStakingParameters(bakerPkh: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getDelegateActiveStakingParameters(bakerPkh, opts));
  }

  async getDelegateLimitOfStakingOverBakingIsPositive(bakerPkh: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getDelegateLimitOfStakingOverBakingIsPositive(bakerPkh, opts));
  }

  async getStakedBalance(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getStakedBalance(address, opts));
  }

  async getUnstakeRequests(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getUnstakeRequests(address, opts));
  }

  async getUnstakedFrozenBalance(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getUnstakedFrozenBalance(address, opts));
  }

  async getUnstakedFinalizableBalance(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getUnstakedFinalizableBalance(address, opts));
  }

  async getBigMapExpr(id: string, expr: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBigMapExpr(id, expr, opts));
  }

  async getAllDelegates(args?: AllDelegatesQueryArguments, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getAllDelegates(args, opts));
  }

  async getDelegates(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getDelegates(address, opts));
  }

  async getVotingInfo(address: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getVotingInfo(address, opts));
  }

  async getConstants(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getConstants(opts));
  }

  async getBlock(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBlock(opts));
  }

  async getBlockHeader(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBlockHeader(opts));
  }

  async getBlockMetadata(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBlockMetadata(opts));
  }

  async getBakingRights(args?: BakingRightsQueryArguments, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBakingRights(args, opts));
  }

  async getAttestationRights(args?: AttestationRightsQueryArguments, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getAttestationRights(args, opts));
  }

  async getBallotList(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBallotList(opts));
  }

  async getBallots(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getBallots(opts));
  }

  async getCurrentProposal(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getCurrentProposal(opts));
  }

  async getCurrentQuorum(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getCurrentQuorum(opts));
  }

  async getVotesListings(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getVotesListings(opts));
  }

  async getProposals(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getProposals(opts));
  }

  async simulateOperation(op: RPCSimulateOperationParam, opts?: RPCOptions) {
    return this.callWithFallback(client => client.simulateOperation(op, opts));
  }

  async preapplyOperations(ops: PreapplyParams, opts?: RPCOptions) {
    return this.callWithFallback(client => client.preapplyOperations(ops, opts));
  }

  async injectOperation(signedOpBytes: string) {
    return this.callWithFallback(client => client.injectOperation(signedOpBytes));
  }

  async forgeOperations(data: ForgeOperationsParams, opts?: RPCOptions) {
    return this.callWithFallback(client => client.forgeOperations(data, opts));
  }

  async runCode(code: RPCRunCodeParam, opts?: RPCOptions) {
    return this.callWithFallback(client => client.runCode(code, opts));
  }

  async runScriptView(param: RPCRunScriptViewParam, opts?: RPCOptions) {
    return this.callWithFallback(client => client.runScriptView(param, opts));
  }

  async runView(param: RPCRunViewParam, opts?: RPCOptions) {
    return this.callWithFallback(client => client.runView(param, opts));
  }

  async packData(data: PackDataParams, opts?: RPCOptions) {
    return this.callWithFallback(client => client.packData(data, opts));
  }

  async getCurrentPeriod(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getCurrentPeriod(opts));
  }

  async getSuccessorPeriod(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getSuccessorPeriod(opts));
  }

  async getSaplingDiffById(id: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getSaplingDiffById(id, opts));
  }

  async getSaplingDiffByContract(contract: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getSaplingDiffByContract(contract, opts));
  }

  async getProtocolActivations(protocol?: string | undefined) {
    return this.callWithFallback(client => client.getProtocolActivations(protocol));
  }

  async getStorageUsedSpace(contract: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getStorageUsedSpace(contract, opts));
  }

  async getStoragePaidSpace(contract: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getStoragePaidSpace(contract, opts));
  }

  async getTicketBalance(contract: string, ticket: TicketTokenParams, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getTicketBalance(contract, ticket, opts));
  }

  async getAllTicketBalances(contract: string, opts?: RPCOptions) {
    return this.callWithFallback(client => client.getAllTicketBalances(contract, opts));
  }

  async getAdaptiveIssuanceLaunchCycle(opts?: RPCOptions) {
    return this.callWithFallback(client => client.getAdaptiveIssuanceLaunchCycle(opts));
  }

  async getPendingOperations(args?: PendingOperationsQueryArguments) {
    return this.callWithFallback(client => client.getPendingOperations(args));
  }
}

function shouldFallbackToNext(error: any): boolean {
  if (isCounterError(error)) {
    // Counter errors should NOT fallback - they indicate invalid operation data
    // that needs to be rebuilt with a fresh counter, not retried on another RPC
    return false;
  }

  if (isNonRetryableTezosError(error)) {
    // Known non-retryable Tezos operation errors should NOT fallback.
    // These indicate deterministic operation failures unrelated to the specific RPC node
    return false;
  }

  if (error instanceof HttpResponseError) {
    const status = error.status ?? 0;
    // Retry on rate limits, timeouts, server/unavailable, and not found
    return status === 404 || status === 408 || status === 429 || status >= 500;
  }
  // Network/transport errors -> fallback
  return true;
}

const COUNTER_ERROR_MESSAGES = ['counter_in_the_past', 'counter_in_the_future'];

function isCounterError(error: any): boolean {
  if (error instanceof HttpResponseError) {
    return COUNTER_ERROR_MESSAGES.some(m => error.message.includes(m));
  }
  return false;
}

const NON_RETRYABLE_TEZ_ERROR_ID_SUBSTRINGS = [
  'empty_implicit_contract',
  'empty_implicit_delegated_contract',
  'storage_exhausted',
  'gas_exhausted',
  'balance_too_low',
  'subtraction_underflow'
];

function includesKnownNonRetryableTezId(id: string): boolean {
  return NON_RETRYABLE_TEZ_ERROR_ID_SUBSTRINGS.some(substr => id.includes(substr));
}

function isNonRetryableTezosError(error: any): boolean {
  if (error instanceof TezosOperationError) {
    return error.errors.some(e => includesKnownNonRetryableTezId(e.id));
  }

  if (error instanceof HttpResponseError) {
    try {
      const parsed = JSON.parse(error.body);
      if (Array.isArray(parsed)) {
        return parsed.some(e => isDefined(e.id) && includesKnownNonRetryableTezId(e.id));
      }
    } catch {
      // ignore parse errors
    }
  }

  return false;
}
