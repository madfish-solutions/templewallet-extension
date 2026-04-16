import { ReactComponent as HyperliquidIcon } from './icons/hyperliquid.svg';
import { ReactComponent as LimitlessIcon } from './icons/limitless.svg';
import { ReactComponent as PolymarketIcon } from './icons/polymarket.svg';

export interface DAppForDeposit {
  id: string;
  link: string;
  name: string;
  description: string;
  icon: ImportedSVGComponent;
}

export const DAPPS_FOR_DEPOSITS: DAppForDeposit[] = [
  {
    id: 'hyperliquid',
    link: 'https://app.hyperliquid.xyz',
    name: 'Hyperliquid',
    description: 'Perp DEX',
    icon: HyperliquidIcon
  },
  {
    id: 'limitless',
    link: 'https://limitless.exchange',
    name: 'Limitless',
    description: 'Predictions',
    icon: LimitlessIcon
  },
  {
    id: 'polymarket',
    link: 'https://polymarket.com',
    name: 'Polymarket',
    description: 'Predictions',
    icon: PolymarketIcon
  }
];
