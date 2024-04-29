import { BalanceItem } from '../apis/temple/evm-data.interfaces';

export const isProperMetadata = (metadata: BalanceItem) =>
  metadata.contract_address &&
  metadata.contract_ticker_symbol &&
  metadata.contract_display_name &&
  metadata.contract_decimals;
