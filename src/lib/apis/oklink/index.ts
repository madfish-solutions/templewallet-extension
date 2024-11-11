import axios from 'axios';

import { filterUnique } from 'lib/utils';

/** Maximum allowed for the endpoint */
const MAX_HASHES_FOR_FILLS = 20;

export async function fetchOklinkTransactions(
  address: string,
  chainId: number,
  olderThanBlockHeight?: `${number}`,
  // newerThanBlockHeight?: string,
  signal?: AbortSignal
) {
  const chainShortName = CHAINS[chainId];
  if (!chainShortName) return [];

  const endBlockHeight = olderThanBlockHeight ? String(Number(olderThanBlockHeight) - 1) : undefined;

  const [data1, data2, data3, data4, data5] = await Promise.all([
    makeTransactionsRequest(address, chainShortName, 'transaction', endBlockHeight, signal),
    makeTransactionsRequest(address, chainShortName, 'token_20', endBlockHeight, signal),
    makeTransactionsRequest(address, chainShortName, 'token_721', endBlockHeight, signal),
    makeTransactionsRequest(address, chainShortName, 'token_1155', endBlockHeight, signal),
    makeTransactionsRequest(address, chainShortName, 'token_10', endBlockHeight, signal)
  ]);

  const allItems = [
    ...data1.transactionLists,
    ...data2.transactionLists,
    ...data3.transactionLists,
    ...data4.transactionLists,
    ...data5.transactionLists
  ].sort((a, b) => (a.transactionTime > b.transactionTime ? -1 : 1));

  const uniqHashes = filterUnique(allItems.map(item => item.txId)).slice(0, MAX_HASHES_FOR_FILLS);

  await new Promise(r => void setTimeout(r, 1_000));

  const fillsRes = await makeTransactionsFillsRequest(address, chainShortName, uniqHashes);

  return fillsRes.sort((a, b) => (a.transactionTime > b.transactionTime ? -1 : 1));
}

/** See: https://www.oklink.com/docs/en/#fundamental-blockchain-data-address-data-get-address-transaction-list */
async function makeTransactionsRequest(
  address: string,
  chainShortName: string,
  /** Defaults to 'transaction' */
  protocolType?: ProtocolType,
  // startBlockHeight?: string,
  endBlockHeight?: string,
  signal?: AbortSignal
) {
  const data = await axios
    .get<OklinkResponse<[TransactionListResponseData]>>('explorer/address/transaction-list', {
      baseURL: 'https://www.oklink.com/api/v5',
      headers: {
        'Ok-Access-Key': ''
      },
      params: {
        chainShortName,
        address,
        limit: 50, // Maximum allowed
        // page: '1',
        protocolType,
        // startBlockHeight,
        endBlockHeight
      },
      signal
    })
    .then(response => {
      if (response.data.code !== '0') throw new Error(response.data.msg);

      return response.data.data[0];
    });

  return data;
}

interface OklinkResponse<T> {
  code: string;
  msg: string;
  data: T;
}

type ProtocolType = 'transaction' | 'token_20' | 'token_721' | 'token_1155' | 'token_10';

interface TransactionListResponseData {
  /** number */
  page: string;
  /** number */
  limit: string;
  /** number */
  totalPage: string;
  chainFullName: string;
  chainShortName: string;
  transactionLists: OklinkTransaction[];
}

export interface OklinkTransaction {
  txId: HexString;
  /**
   * 0xa22cb465 = 'ApprovalForAll'
   */
  methodId: '' | HexString;
  blockHash: HexString;
  /** number */
  height: string;
  /** number - UNIX time */
  transactionTime: string;
  from: HexString;
  to: HexString;
  isFromContract: boolean;
  isToContract: boolean;
  /** Decimal number */
  amount: string;
  transactionSymbol: string;
  /** Decimal number */
  txFee: string;
  state: 'success' | 'fail' | 'pending';
  tokenContractAddress: '' | HexString;
  tokenId: '';
  challengeStatus: '';
  l1OriginHash: '';
}

/** See: https://www.oklink.com/docs/en/#fundamental-blockchain-data-address-data-get-address-transaction-list */
async function makeTransactionsFillsRequest(
  address: string,
  chainShortName: string,
  hashes: HexString[],
  signal?: AbortSignal
) {
  const data = await axios
    .get<OklinkResponse<TransactionFillsResponseDataItem[]>>('explorer/transaction/transaction-fills', {
      baseURL: 'https://www.oklink.com/api/v5',
      headers: {
        'Ok-Access-Key': ''
      },
      params: {
        chainShortName,
        address,
        txid: String(hashes)
      },
      signal
    })
    .then(response => {
      if (response.data.code !== '0') throw new Error(response.data.msg);

      return response.data.data;
    });

  return data;
}

export interface TransactionFillsResponseDataItem {
  chainFullName: string;
  chainShortName: string;
  txid: HexString;
  /** integer */
  height: `${number}`;
  /** UNIX time */
  transactionTime: string;
  /** float */
  amount: string;
  transactionSymbol: string;
  /** float */
  txfee: string;
  /** integer */
  index: string;
  /** integer */
  confirm: string;
  inputDetails: [
    {
      inputHash: HexString;
      isContract: boolean;
      amount: '';
    }
  ];
  outputDetails: [
    {
      outputHash: HexString;
      isContract: boolean;
      amount: '';
    }
  ];
  state: 'success';
  /** integer */
  gasLimit: string;
  /** integer */
  gasUsed: string;
  /** float */
  gasPrice: string;
  totalTransactionSize: '';
  virtualSize: '0';
  weight: '';
  nonce: string;
  /**
   * 0：original transaction
   * 1: EIP2930
   * 2: EIP1559
   */
  transactionType: '0' | '1' | '2';
  methodId: '' | HexString;
  errorLog: '';
  inputData: HexString;
  isAaTransaction: boolean;
  tokenTransferDetails: {
    /** integer */
    index: `${number}`;
    /** Full name */
    token: string;
    tokenContractAddress: '' | HexString;
    symbol: string;
    from: HexString;
    to: HexString;
    /** integer */
    tokenId: '' | `${number}`;
    /** float */
    amount: `${number}`;
    isFromContract: boolean;
    isToContract: boolean;
  }[];
  contractDetails: {
    index: `${number}` | `${number}_${string}`;
    from: HexString;
    to: HexString;
    /** float */
    amount: `${number}`;
    gasLimit: `${number}`;
    isFromContract: boolean;
    isToContract: boolean;
  }[];
}

const CHAINS: Record<number, string> = {
  1: 'ETH',
  10: 'OP',
  56: 'BSC',
  61: 'ETC',
  66: 'OKTC',
  100: 'GNOSIS',
  137: 'POLYGON',
  250: 'FTM',
  324: 'ZKSYNC',
  459: 'KAVA',
  8453: 'BASE',
  1101: 'POLYGON_ZKEVM',
  2020: 'RONIN',
  8217: 'KAIA',
  42161: 'ARBITRUM',
  43114: 'AVAXC',
  59144: 'LINEA',
  10001: 'ETHW',
  80002: 'AMOY_TESTNET',
  80001: 'MUMBAI_TESTNET',
  81457: 'BLAST',
  513100: 'DIS (ETHF)',
  534352: 'SCROLL', //
  11155111: 'SEPOLIA_TESTNET'
};
