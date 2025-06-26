import { TempleChainKind } from 'temple/types';

export interface ReceivePayload {
  address: string;
  chainKind: TempleChainKind;
}
