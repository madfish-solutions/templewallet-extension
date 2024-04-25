import { TempleChainName } from 'temple/types';

export interface PrivateKeyPayload {
  chain: TempleChainName;
  address: string;
  privateKey: string;
}
