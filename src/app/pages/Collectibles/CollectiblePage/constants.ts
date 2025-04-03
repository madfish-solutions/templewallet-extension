import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';

export const TEZOS_DETAILS_SYNC_INTERVAL = 4 * TEZOS_BLOCK_DURATION;

export const PROPERTIES_TAB = { name: 'properties', titleI18nKey: 'properties' } as const;
export const ATTRIBUTES_TAB = { name: 'attributes', titleI18nKey: 'attributes' } as const;
