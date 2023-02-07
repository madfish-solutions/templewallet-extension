export const ROUTE3_CONTRACT = process.env.TEMPLE_WALLET_ROUTE3_CONTRACT ?? '';

if (!ROUTE3_CONTRACT) throw new Error('process.env.TEMPLE_WALLET_ROUTE3_CONTRACT not found.');
