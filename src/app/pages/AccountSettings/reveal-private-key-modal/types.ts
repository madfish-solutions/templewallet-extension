import { TempleChainKind } from 'temple/types';

export interface PrivateKeyPayload {
  chain: TempleChainKind;
  address: string;
  privateKey: string;
}
