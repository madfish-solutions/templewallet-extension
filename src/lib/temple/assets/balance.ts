import { ChainIds, TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { loadContract } from 'lib/temple/contract';

import { AssetMetadata, TEZOS_METADATA } from '../metadata';
import { isGasAsset, fromAssetSlug, isFA2Token } from './utils';

const fetchRawTezosBalance = async (tezos: TezosToolkit, account: string) => {
  const balance = await callTezosGetBalanceSafe(tezos, account);
  return toValidBignumber(balance);
};

export const fetchRawBalance = async (tezos: TezosToolkit, assetSlug: string, account: string) => {
  const asset = await fromAssetSlug(tezos, assetSlug);

  if (isGasAsset(asset)) return await fetchRawTezosBalance(tezos, account);

  let nat;

  const contract = await loadContract(tezos, asset.contract, false);
  const chainId = (await tezos.rpc.getChainId()) as ChainIds;

  try {
    if (isFA2Token(asset)) {
      const response = await contract.views.balance_of([{ owner: account, token_id: asset.id }]).read(chainId);
      nat = response[0].balance;
    } else {
      nat = await contract.views.getBalance(account).read(chainId);
    }
  } catch {}

  return toValidBignumber(nat);
};

export const toFloatBalance = (rawBalance: BigNumber, { decimals }: AssetMetadata) => {
  return rawBalance.div(10 ** decimals);
};

/**
 * @deprecated // Doesn't distinguish different gas tokens
 */
export const fetchTezosFloatBalance = async (tezos: TezosToolkit, account: string) => {
  const rawBalance = await fetchRawTezosBalance(tezos, account);

  return toFloatBalance(rawBalance, TEZOS_METADATA);
};

/**
 * @deprecated // Allows absent metadata
 */
export const fetchFloatBalance = async (
  tezos: TezosToolkit,
  assetSlug: string,
  account: string,
  metadata: AssetMetadata | null
) => {
  if (isGasAsset(assetSlug)) return fetchTezosFloatBalance(tezos, account);

  const rawBalance = await fetchRawBalance(tezos, assetSlug, account);

  return metadata ? toFloatBalance(rawBalance, metadata) : rawBalance;
};

const callTezosGetBalance = (tezos: TezosToolkit, account: string) => tezos.tz.getBalance(account);

const callTezosGetBalanceSafe = async (tezos: TezosToolkit, account: string) => {
  try {
    return await callTezosGetBalance(tezos, account);
  } catch {
    return;
  }
};

const toValidBignumber = (value: any) => {
  const bigNumber = toBignumber(value);
  return bigNumber.isFinite() ? bigNumber : new BigNumber(0);
};

/**
 * (!) Passed value might also be a BigNumber instance of another version.
 * E.g. when it comes from a 3rd-party library
 */
const toBignumber = (value: any) => {
  if (value instanceof BigNumber) return value;
  try {
    return new BigNumber(value.toString());
  } catch {}
  return new BigNumber(NaN);
};
