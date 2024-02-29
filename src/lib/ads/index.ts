export enum AdsProviderTitle {
  Optimal = 'Optimal',
  HypeLab = 'HypeLab',
  Persona = 'Persona',
  Temple = 'Temple Wallet'
}

export type AdsProviderName = keyof typeof AdsProviderTitle;
