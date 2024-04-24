import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { getEvmAssetRecordKey, isProperMetadata } from 'lib/utils/evm.utils';

import { EVMBalancesAtomicRecord } from './state';

export const getNewBalancesAtomicRecord = (
  oldRecord: EVMBalancesAtomicRecord,
  publicKeyHash: HexString,
  data: BalancesResponse[]
) =>
  data.reduce<EVMBalancesAtomicRecord>((acc, currentValue) => {
    if (!currentValue.chain_id) return acc;

    acc[publicKeyHash] = Object.assign(
      {},
      acc[publicKeyHash] ?? {},
      getTokenSlugWithChainIdBalanceRecord(currentValue.items, currentValue.chain_id)
    );

    return acc;
  }, oldRecord);

const getTokenSlugWithChainIdBalanceRecord = (data: BalanceItem[], chainId: ChainID) =>
  data.reduce<StringRecord>((acc, currentValue) => {
    if (!isProperMetadata(currentValue)) {
      return acc;
    }

    acc[getEvmAssetRecordKey(toTokenSlug(currentValue.contract_address), chainId)] = currentValue.balance ?? '';

    return acc;
  }, {});
