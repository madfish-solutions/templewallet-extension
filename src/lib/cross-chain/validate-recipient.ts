import { validate as multiNetworkValidateAddress } from '@temple-wallet/wallet-address-validator';
import { isAddress } from 'viem';

import { isValidTezosAddress } from 'lib/tezos';

import { CrossChainAsset } from './types';

export const validateCrossChainRecipient = (address: string | null | undefined, toAsset: CrossChainAsset): true | string => {
  if (!address || address.trim().length === 0) return 'Required';

  const trimmed = address.trim();

  switch (toAsset.dest) {
    case 'tezos':
      return isValidTezosAddress(trimmed) ? true : 'Invalid Tezos address';
    case 'evm':
      return isAddress(trimmed) ? true : 'Invalid EVM address';
    case 'btc':
      // Validator's segwit check accepts `tb1`/`bcrt1` (testnet) regardless of the network arg.
      // Exolix only routes to the mainnet, so reject testnet prefixes ourselves before delegating.
      if (/^(tb1|bcrt1)/i.test(trimmed)) return 'Invalid Bitcoin address';
      return multiNetworkValidateAddress(trimmed, 'BTC', 'prod') ? true : 'Invalid Bitcoin address';
    default:
      return 'Unsupported destination';
  }
};
