import { FC } from 'react';

import { IconBase } from 'app/atoms';
import { Logo } from 'app/atoms/Logo';
import { ReactComponent as LockIcon } from 'app/icons/base/lock.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { TextPromotionView } from 'app/templates/partners-promotion/components/text-promotion-view';
import { AdsProviderTitle } from 'lib/ads';
import { HOME_PAGE_NAME } from 'lib/ads-constants/ads-constants';
import { browser } from 'lib/browser';

import BinanceGrayscaleIconSrc from './binance-grayscale.svg?url';
import { ReactComponent as ChatGptIcon } from './chatgpt-icon.svg';
import tkeyCoinsSrc from './tkey-coins.png';

const noop = () => undefined;

export const InWalletAdExample: FC = () => (
  <div className="pointer-events-none">
    <TextPromotionView
      className="pr-2!"
      accountPkh=""
      href="#"
      isVisible
      imageSrc={browser.runtime.getURL('misc/token-logos/tkey.png')}
      headline="6.5% APY on your TEZ"
      contentText="Receive TKEY payouts for Tezos delegation"
      providerTitle={AdsProviderTitle.Temple}
      pageName={HOME_PAGE_NAME}
      onAdRectVisible={noop}
      onImageError={noop}
    />
  </div>
);

export const BrowsingAdExample: FC = () => (
  <div className="w-full h-40 rounded-lg border border-lines shadow-bottom overflow-hidden bg-white">
    <div className="flex items-center gap-1.5 px-3 py-2 bg-input-low border-b border-lines">
      <span className="size-2.5 rounded-circle bg-[#ff5f57]" />
      <span className="size-2.5 rounded-circle bg-[#febc2e]" />
      <span className="size-2.5 rounded-circle bg-[#28c840]" />
      <div className="flex-1 min-w-0 px-2">
        <div className="flex items-center gap-1.5 bg-white border border-[#d0d0d0] rounded-sm px-2 py-0.5">
          <LockIcon className="size-2.5 shrink-0 fill-current text-[#555]" />
          <span className="text-font-small text-[#555] truncate">www.cryptomarket.com/tkey</span>
        </div>
      </div>
    </div>

    <div className="px-3 pt-2.5">
      <div className="relative flex items-center overflow-hidden rounded-sm bg-grey-4 border-0.5 border-lines px-2.5 py-1.5">
        <p className="text-font-regular-bold leading-5 min-w-0">
          Temple Wallet growth with <span className="text-[#ffca28]">TKEY</span>
        </p>
        <img src={tkeyCoinsSrc} alt="" className="w-auto h-10 object-contain shrink-0" />
        <div className="flex flex-col gap-1 text-[0.5rem] font-medium text-grey-1 whitespace-nowrap shrink-0 leading-tight">
          <p>🤩 Deflationary token</p>
          <p>🔥 Permanent burn</p>
          <p>😏 Regular buyback</p>
        </div>
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-black/75">
          <div className="size-4.5 overflow-hidden flex items-center justify-center">
            <Logo type="icon" size={12} />
          </div>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-1">
        <div className="h-2 w-24 rounded-sm bg-[#e8e8e8]" />
        <div className="h-3 w-full rounded-sm bg-[#e0e0e0]" />
        <div className="h-3 w-3/4 rounded-sm bg-[#e0e0e0]" />
        <div className="h-13 w-full rounded-sm bg-[#e8e8e8]" />
      </div>
    </div>
  </div>
);

export const AiAdExample: FC = () => (
  <div className="w-full rounded-lg border-0.5 border-lines shadow-bottom overflow-hidden bg-white text-black">
    <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b-0.5 border-grey-4">
      <ChatGptIcon className="size-4.5 shrink-0" />
      <p className="text-font-description-bold">ChatAI</p>
    </div>

    <div className="px-4 py-2 flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="bg-input-low rounded-2xl px-3 py-2">
          <p className="text-font-small">Temple pays 20% sponsored revenue to users</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="self-start flex items-center gap-2 bg-primary/15 rounded-md pl-0.5 pr-1.5 py-0.5">
          <div className="flex items-center gap-1">
            <img src={BinanceGrayscaleIconSrc} alt="" className="size-5" />
            <span className="text-font-small">Sponsored</span>
          </div>
          <div className="flex items-center gap-1">
            <Logo type="icon" size={12} />
            <span className="text-font-small">Ads by Temple</span>
            <IconBase Icon={CloseIcon} size={12} className="text-grey-1" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 h-5.75">
          <div className="flex items-center gap-0.75">
            <span className="size-1 rounded-circle bg-[#666] opacity-95" />
            <span className="size-1 rounded-circle bg-[#666] opacity-50" />
            <span className="size-1 rounded-circle bg-[#666] opacity-30" />
          </div>
          <span className="text-font-small text-grey-1">Thinking</span>
        </div>
      </div>
    </div>
  </div>
);
