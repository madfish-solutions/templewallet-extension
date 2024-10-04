import { GoldRushTransaction, GoldRushERC20Transaction } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetMetadataGetter } from 'lib/metadata';
import { getEvmAddressSafe } from 'lib/utils/evm.utils';

import { ActivityOperKindEnum, EvmActivityAsset, EvmOperation } from '../../types';
import { getAssetSymbol } from '../../utils';

export function parseGasTransfer(
  item: GoldRushTransaction | GoldRushERC20Transaction,
  accountAddress: string,
  /** Only way to suspect transfering to a contract, not an account */
  partOfBatch: boolean,
  getMetadata: EvmAssetMetadataGetter
): EvmOperation | null {
  const value: string = item.value?.toString() ?? '0';

  if (value === '0') return null;

  const kind = (() => {
    if (getEvmAddressSafe(item.from_address) === accountAddress)
      return partOfBatch ? ActivityOperKindEnum.transferFrom : ActivityOperKindEnum.transferFrom_ToAccount;
    if (getEvmAddressSafe(item.to_address) === accountAddress)
      return partOfBatch ? ActivityOperKindEnum.transferTo : ActivityOperKindEnum.transferTo_FromAccount;

    return null;
  })();

  if (!kind) return null;

  const metadata = getMetadata(EVM_TOKEN_SLUG);
  const decimals = metadata?.decimals ?? item.gas_metadata?.contract_decimals;

  if (decimals == null) return null;

  const symbol = getAssetSymbol(metadata) || item.gas_metadata?.contract_ticker_symbol;

  const asset: EvmActivityAsset = {
    contract: EVM_TOKEN_SLUG,
    amount: kind === ActivityOperKindEnum.transferFrom_ToAccount ? `-${value}` : value,
    decimals,
    symbol
  };

  return { kind, asset };
}
