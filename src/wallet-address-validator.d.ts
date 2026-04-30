declare module '@temple-wallet/wallet-address-validator' {
  export function validate(address: string, currency: string, networkType?: 'prod' | 'testnet' | 'both'): boolean;
}
