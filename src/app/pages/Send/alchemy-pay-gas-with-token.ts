import { numberToHex } from 'viem';

export const alchemyGasPaymentTokenAddresses: Record<number, HexString> = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
};
export const ALCHEMY_GAS_PAYMENT_TOKEN_SYMBOL = 'USDC';
export const ALCHEMY_GAS_PAYMENT_TOKEN_DECIMALS = 6;

export const getAlchemyGasPaymentChainId = (chainId: number) => numberToHex(chainId);

export const isAlchemyGasPaymentSupportedChain = (chainId: number) => chainId in alchemyGasPaymentTokenAddresses;

export const getAlchemyGasPaymentAssetSlug = (chainId: number) => alchemyGasPaymentTokenAddresses[chainId];
