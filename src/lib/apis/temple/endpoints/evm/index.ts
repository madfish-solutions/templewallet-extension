import type { RecentTransactionsResponse, TransactionsResponse, Erc20TransfersResponse } from '@covalenthq/client-sdk';

import { templeWalletApi } from '../templewallet.api';

import { BalancesResponse, ChainID, NftAddressBalanceNftResponse } from './api.interfaces';

export const getEvmBalances = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/balances', walletAddress, chainId);

/** Response also contains exchange rates */
export const getEvmTokensMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<BalancesResponse>('/tokens-metadata', walletAddress, chainId);

export const getEvmCollectiblesMetadata = (walletAddress: string, chainId: ChainID) =>
  buildEvmRequest<NftAddressBalanceNftResponse>('/collectibles-metadata', walletAddress, chainId);

/** Calls to GoldRush v3 endpoints */
export const getEvmTransactions = (walletAddress: string, chainId: ChainID, page?: number, signal?: AbortSignal) =>
  buildEvmRequest<TransactionsResponse | RecentTransactionsResponse>(
    '/transactions',
    walletAddress,
    chainId,
    {
      page
    },
    signal
  ).then(({ items, current_page }) => ({
    items: items ?? [],
    /** null | > 0 */
    nextPage: current_page && current_page > 1 ? current_page - 1 : null
  }));

/** Calls to GoldRush v2 endpoints */
export const getEvmERC20Transfers = (
  walletAddress: string,
  chainId: ChainID,
  contractAddress: string,
  page?: number,
  signal?: AbortSignal
) =>
  buildEvmRequest<Erc20TransfersResponse>(
    '/erc20-transfers',
    walletAddress,
    chainId,
    {
      contractAddress,
      page
    },
    signal
  ).then(({ items, pagination }) => {
    const withoutNextPage = items && pagination ? items.length < pagination.page_size : true;

    return {
      items: items ?? [],
      /** null | > 0 */
      nextPage: withoutNextPage ? null : pagination?.page_number ?? 0 + 1
    };
  });

const buildEvmRequest = <T>(
  url: string,
  walletAddress: string,
  chainId: ChainID,
  params?: object,
  signal?: AbortSignal
) =>
  templeWalletApi
    .get<T>(`evm${url}`, {
      params: { ...params, walletAddress, chainId },
      signal
    })
    .then(
      res => res.data,
      error => {
        console.error(error);
        throw error;
      }
    );
