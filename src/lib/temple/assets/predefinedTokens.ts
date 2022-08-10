import { TempleChainId } from '../types';

const PREDEFINED_TOKENS_SLUGS_RECORD: Record<string, string[]> = {
  [TempleChainId.Mainnet]: [
    'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn_0',
    'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_19',
    'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV_0',
    'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW_0',
    'KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb_0'
  ],
  [TempleChainId.Dcp]: ['KT1N7Rh6SgSdExMPxfnYw1tHqrkSm7cm6JDN_0']
};

export const getPredefinedTokensSlugs = (chainId: string) => PREDEFINED_TOKENS_SLUGS_RECORD[chainId] ?? [];
