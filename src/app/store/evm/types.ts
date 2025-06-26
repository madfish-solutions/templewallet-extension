import { BalancesResponse as TempleBalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';

export interface BalancesResponse extends Omit<TempleBalancesResponse, 'chain_id'> {
  chain_id: number;
}
