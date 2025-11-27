import React, { FC, memo } from 'react';

import { Button } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as ApplePayIcon } from 'app/icons/payment-options/apple-pay-no-frame.svg';
import { ReactComponent as MastercardIcon } from 'app/icons/payment-options/mastercard.svg';
import { ReactComponent as VisaIcon } from 'app/icons/payment-options/visa.svg';
import { t } from 'lib/i18n';
import { navigate } from 'lib/woozie';

import BuyWithFiatIllustrationSrc from '../../pages/Home/OtherComponents/Tokens/components/tokens-tab-base/buy-with-fiat.png';
import CrossChainSwapIllustrationSrc from '../../pages/Home/OtherComponents/Tokens/components/tokens-tab-base/cross-chain-swap.png';
import ReceiveIllustrationSrc from '../../pages/Home/OtherComponents/Tokens/components/tokens-tab-base/receive-on-chain.png';

import { DepositModalSelectors } from './selectors';

interface DepositModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  openDebitCreditCardModal: EmptyFn;
  openCryptoExchangeModal: EmptyFn;
}

export const DepositModal: FC<DepositModalProps> = memo(
  ({ opened, onRequestClose, openDebitCreditCardModal, openCryptoExchangeModal }) => {
    const handleReceiveOnChain = () => {
      onRequestClose();
      // Navigate to receive page
      navigate('/receive');
    };

    const handleBuyWithFiat = () => {
      onRequestClose();
      openDebitCreditCardModal();
    };

    const handleCrossChainSwap = () => {
      onRequestClose();
      openCryptoExchangeModal();
    };

    return (
      <PageModal
        miniVersion
        opened={opened}
        title={t('deposit')}
        headerContainerPadding={false}
        headerContainerClassName="p-3"
        onRequestClose={onRequestClose}
        testID={DepositModalSelectors.depositModal}
      >
        <div className="flex flex-col gap-3 p-4 pt-4 pb-6 bg-background">
          <DepositOption
            illustrationSrc={ReceiveIllustrationSrc}
            title="Receive on-chain"
            description="Transfer crypto via address or QR code from other wallets or exchanges"
            onClick={handleReceiveOnChain}
            testID={DepositModalSelectors.receiveOnChainOption}
          />

          <DepositOption
            illustrationSrc={BuyWithFiatIllustrationSrc}
            title="Buy with Fiat"
            description="Purchase crypto via credit or debit card with 26+ currencies options"
            paymentIcons
            onClick={handleBuyWithFiat}
            testID={DepositModalSelectors.buyWithFiatOption}
          />

          <DepositOption
            illustrationSrc={CrossChainSwapIllustrationSrc}
            title="Cross-Chain Swap"
            description="Exchange crypto instantly from Solana, Bitcoin and other networks"
            onClick={handleCrossChainSwap}
            testID={DepositModalSelectors.crossChainSwapOption}
          />
        </div>
      </PageModal>
    );
  }
);

interface DepositOptionProps {
  illustrationSrc: string;
  title: string;
  description: string;
  paymentIcons?: boolean;
  onClick: EmptyFn;
  testID?: string;
}

const fiatOptionsIcons = [MastercardIcon, VisaIcon, ApplePayIcon];

const DepositOption: FC<DepositOptionProps> = memo(
  ({ illustrationSrc, title, description, paymentIcons, onClick, testID }) => (
    <Button
      className="flex items-center gap-2 p-4 rounded-lg bg-white hover:bg-grey-4 border-0.5 border-lines"
      onClick={onClick}
      testID={testID}
    >
      <img src={illustrationSrc} alt="" className="w-14 h-14 object-contain" />

      <div className="flex-1 flex flex-col gap-1 text-left">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-font-medium-bold text-black">{title}</span>
          {paymentIcons && (
            <div className="flex gap-1 items-center">
              {fiatOptionsIcons.map((Icon, index) => (
                <div
                  className="w-[29px] h-5 px-1 flex items-center justify-center border-0.5 border-lines rounded"
                  key={index}
                >
                  <Icon />
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-font-description text-grey-1">{description}</p>
      </div>
    </Button>
  )
);
