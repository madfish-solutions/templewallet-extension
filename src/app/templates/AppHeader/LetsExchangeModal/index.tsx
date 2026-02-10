import React, { CSSProperties, memo, useCallback } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import DAppLogo from 'app/atoms/DAppLogo';
import { Logo } from 'app/atoms/Logo';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { browser } from 'lib/browser';
import { useDidMount } from 'lib/ui/hooks';

import image10Src from './image_10.png';
import image13Src from './image_13.png';
import image14Src from './image_14.png';
import image17Src from './image_17.png';
import letsExchangeLogoSrc from './letsexchange-logo.png';
import { LetsExchangeModalSelectors } from './selectors';

interface LetsExchangeModalProps {
  onClose: EmptyFn;
  onShown: EmptyFn;
}

const LETS_EXCHANGE_URL = 'https://letsexchange.io/?ref_id=CtN9tIep5v36D2mb';

const noBrokerFeeTagStyle = { top: '6.154896rem', left: '12.291082rem', rotate: '2.43deg' };
const xStocksTagStyle = { top: '4.526980rem', left: '15.654548rem', rotate: '-1.69deg' };
const plentyOfCryptoTagStyle = { top: '6.186811rem', left: '2.544388rem', rotate: '-2.67deg' };
const buySellTagStyle = { top: '4.4743rem', left: '0.938939rem', rotate: '3.8deg' };

export const LetsExchangeModal = memo<LetsExchangeModalProps>(({ onClose, onShown }) => {
  const handleLinkClick = useCallback(async () => {
    onClose();
    await browser.tabs.create({ url: LETS_EXCHANGE_URL });
  }, [onClose]);

  useDidMount(onShown);

  return (
    <ActionModal
      className="outline-hidden"
      contentClassName="pt-5 pb-1 border-none"
      title="LetsExchange in Dapps!"
      closeButtonTestID={LetsExchangeModalSelectors.closeButton}
      onClose={onClose}
    >
      <ActionModalBodyContainer className="pt-0!">
        <div
          className="relative rounded-2xl my-2"
          style={{ background: 'radial-gradient(50% 50% at 50% 50%, #E7F1FC 0%, #F4F4F4 100%)', height: '8.75rem' }}
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <div className="flex gap-2 relative">
              <div className="h-[3.875rem] aspect-square bg-white shadow-card rounded-md flex justify-center items-center">
                <Logo type="icon" style={{ width: 38 }} />
              </div>
              <div className="h-[3.875rem] aspect-square bg-white shadow-card rounded-md flex justify-center items-center">
                <DAppLogo size={39} icon={letsExchangeLogoSrc} origin="letsexchange.io" />
              </div>
              <div
                className={clsx(
                  'w-5 h-5 rounded-full bg-grey-4 flex justify-center items-center',
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                )}
              >
                <IconBase Icon={LinkIcon} size={12} className="text-grey-1" />
              </div>
            </div>
          </div>

          <img
            className="absolute w-11 h-auto"
            src={image10Src}
            style={{ top: '4.26648rem', left: '13.610235rem', rotate: '-4.8deg' }}
          />
          <FeatureTag className="px-1.5" style={noBrokerFeeTagStyle}>
            No Broker Fee
          </FeatureTag>
          <FeatureTag className="px-2" style={xStocksTagStyle}>
            xStocks
          </FeatureTag>
          <img
            className="absolute w-13 h-auto"
            src={image17Src}
            style={{ top: '5.715246rem', left: '17.49872rem', rotate: '9.33deg' }}
          />

          <img
            className="absolute w-11 h-auto"
            src={image13Src}
            style={{ top: '4.310391rem', left: '4.154141rem', rotate: '33.3deg' }}
          />
          <FeatureTag className="px-1.5" style={plentyOfCryptoTagStyle}>
            Plenty of Crypto
          </FeatureTag>
          <FeatureTag className="px-2" style={buySellTagStyle}>
            Buy/Sell
          </FeatureTag>
          <img
            className="absolute w-13 h-auto"
            src={image14Src}
            style={{ top: '5.387033rem', left: '0.105783rem', rotate: '-25.65deg' }}
          />
        </div>

        <p className="mt-1 text-font-description text-grey-1 text-center whitespace-pre-line">
          Discover new go-to crypto exchange hub in Temple.{'\n'}
          Trade Bitcoin, Tezos, Solana, and other top tokens. Add tokenized NVIDIA, Apple or Google xStocks to your
          portfolio. No hidden fees, no extra hassle and non-custodial for full control.{'\n\n'}Try it now or find it
          anytime in our in-wallet Dapps page.
        </p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer className="pb-4">
        <ActionModalButton
          color="secondary-low"
          onClick={handleLinkClick}
          testID={LetsExchangeModalSelectors.letsExchangeButton}
        >
          <div className="flex items-center justify-center gap-0.5">
            <span>LetsExchange</span>
            <IconBase Icon={OutLinkIcon} />
          </div>
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});

interface FeatureTagProps {
  style: CSSProperties;
  className?: string;
}

const FeatureTag = memo<PropsWithChildren<FeatureTagProps>>(({ style, children, className }) => (
  <div
    className={clsx(
      'bg-white rounded-lg py-2 text-font-description-bold absolute border-0.5 border-lines shadow-card',
      className
    )}
    style={style}
  >
    {children}
  </div>
));
