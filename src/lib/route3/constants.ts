import { getPercentageRatio } from './utils/get-percentage-ratio';

export const ROUTE3_CONTRACT = 'KT1Tuta6vbpHhZ15ixsYD3qJdhnpEAuogLQ9';
export const ROUTING_FEE_ADDRESS = 'tz1UbRzhYjQKTtWYvGUWcRtVT4fN3NESDVYT';

const ROUTING_FEE_PERCENT = 0.35;
export const ROUTING_FEE_RATIO = getPercentageRatio(ROUTING_FEE_PERCENT);
