import React, { FC, memo } from 'react';

import { Button } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as ApplePayIcon } from 'app/icons/payment-options/apple-pay-no-frame.svg';
import { ReactComponent as MastercardIcon } from 'app/icons/payment-options/mastercard.svg';
import { ReactComponent as VisaIcon } from 'app/icons/payment-options/visa.svg';
import { navigate } from 'lib/woozie';

import BuyWithFiatIllustrationSrc from '../../pages/Home/OtherComponents/Tokens/components/tokens-tab-base/buy-with-fiat.png';
import CrossChainSwapIllustrationSrc from '../../pages/Home/OtherComponents/Tokens/components/tokens-tab-base/cross-chain-swap.png';

import { DepositModalSelectors } from './selectors';

interface DepositModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
  openDebitCreditCardModal: EmptyFn;
  openCryptoExchangeModal: EmptyFn;
}

export const DepositModal: FC<DepositModalProps> = memo(({
  opened,
  onRequestClose,
  openDebitCreditCardModal,
  openCryptoExchangeModal
}) => {
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
      title="Deposit"
      opened={opened}
      onRequestClose={onRequestClose}
      miniVersion
      animated
      testID={DepositModalSelectors.depositModal}
    >
      <div className="flex flex-col gap-3 p-4 pt-4 pb-6 bg-background">
        <DepositOption
          illustrationSrc={null}
          illustrationType="receive"
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
});

interface DepositOptionProps {
  illustrationSrc: string | null;
  illustrationType?: 'receive';
  title: string;
  description: string;
  paymentIcons?: boolean;
  onClick: EmptyFn;
  testID?: string;
}

const fiatOptionsIcons = [MastercardIcon, VisaIcon, ApplePayIcon];

const DepositOption: FC<DepositOptionProps> = memo(({
  illustrationSrc,
  illustrationType,
  title,
  description,
  paymentIcons,
  onClick,
  testID
}) => (
  <Button
    className="flex items-center gap-2 p-4 rounded-lg bg-white hover:bg-grey-4 border-0.5 border-lines"
    onClick={onClick}
    testID={testID}
  >
    {illustrationType === 'receive' ? (
      <ReceiveIllustration />
    ) : illustrationSrc ? (
      <img src={illustrationSrc} alt="" className="w-14 h-14 object-contain" />
    ) : (
      <div className="w-14 h-14 bg-grey-4 rounded-lg" />
    )}
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
));

// Simple illustration for receive option - QR code style
const ReceiveIllustration = memo(() => (
  <div className="w-14 h-14 flex items-center justify-center bg-secondary-low rounded-lg">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="10" height="10" rx="2" stroke="#1373E4" strokeWidth="2" fill="none"/>
      <rect x="18" y="4" width="10" height="10" rx="2" stroke="#1373E4" strokeWidth="2" fill="none"/>
      <rect x="4" y="18" width="10" height="10" rx="2" stroke="#1373E4" strokeWidth="2" fill="none"/>
      <rect x="7" y="7" width="4" height="4" rx="1" fill="#1373E4"/>
      <rect x="21" y="7" width="4" height="4" rx="1" fill="#1373E4"/>
      <rect x="7" y="21" width="4" height="4" rx="1" fill="#1373E4"/>
      <rect x="18" y="18" width="3" height="3" fill="#1373E4"/>
      <rect x="23" y="18" width="3" height="3" fill="#1373E4"/>
      <rect x="18" y="23" width="3" height="3" fill="#1373E4"/>
      <rect x="23" y="23" width="5" height="5" rx="1" fill="#1373E4"/>
    </svg>
  </div>
));

