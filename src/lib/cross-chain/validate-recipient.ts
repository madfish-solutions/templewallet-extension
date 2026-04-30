import { validate as multiNetworkValidateAddress } from '@temple-wallet/wallet-address-validator';
import { isAddress } from 'viem';

import { TID } from 'lib/i18n';
import { isValidTezosAddress } from 'lib/tezos';

import { CrossChainAsset } from './types';

const isValidBitcoinAddress = (address: string) => {
  // Validator's segwit check accepts `tb1`/`bcrt1` (testnet) regardless of the network arg.
  // Exolix only routes to the mainnet, so reject testnet prefixes ourselves before delegating.
  if (/^(tb1|bcrt1)/i.test(address)) return false;
  return multiNetworkValidateAddress(address, 'BTC');
};

export const validateCrossChainRecipient = (
  address: string | null | undefined,
  toAsset: CrossChainAsset
): true | TID => {
  if (!address || address.trim().length === 0) return 'required';

  const trimmed = address.trim();

  switch (toAsset.dest) {
    case 'tezos':
      return isValidTezosAddress(trimmed) ? true : 'invalidTezosAddress';
    case 'evm':
      return isAddress(trimmed) ? true : 'invalidEvmAddress';
    case 'btc':
      return isValidBitcoinAddress(trimmed) ? true : 'invalidBitcoinAddress';
    default:
      return 'crossChainUnsupportedDestination';
  }
};
