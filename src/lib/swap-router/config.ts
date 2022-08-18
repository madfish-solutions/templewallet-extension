import { checkIsPromotionTime } from '../../app/layouts/PageLayout/utils/checkYupanaPromotion';

export const TEZOS_DEXES_API_URL = 'wss://tezos-dexes-api-mainnet.production.madservice.xyz';

export const ROUTING_FEE_ADDRESS = 'tz1UbRzhYjQKTtWYvGUWcRtVT4fN3NESDVYT';

const isPromotionTime = checkIsPromotionTime();

export const ROUTING_FEE_PERCENT = isPromotionTime ? 0 : 0.5;

export const ROUTING_FEE_RATIO = (100 - ROUTING_FEE_PERCENT) / 100;
