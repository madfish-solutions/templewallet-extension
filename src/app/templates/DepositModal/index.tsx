import React, { FC, memo } from 'react';

import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import BuyWithFiatImageSrc from 'app/misc/deposit/buy-with-fiat.png';
import CrossChainSwapImageSrc from 'app/misc/deposit/cross-chain-swap.png';
import ReceiveImageSrc from 'app/misc/deposit/receive-on-chain.png';
import { t } from 'lib/i18n';

import { DepositOption } from '../deposit-option';

import { DepositModalSelectors } from './selectors';

interface DepositModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const DepositModal: FC<DepositModalProps> = memo(({ opened, onRequestClose }) => (
  <MiniPageModal
    opened={opened}
    title={t('deposit')}
    onRequestClose={onRequestClose}
    testID={DepositModalSelectors.depositModal}
  >
    <div className="flex flex-col gap-3 p-4 pb-6 bg-background">
      <DepositOption
        to="/receive"
        title={t('receiveOnChain')}
        description={t('receiveOnChainDescription')}
        imageSrc={ReceiveImageSrc}
        testID={DepositModalSelectors.receiveOnChain}
      />

      <DepositOption
        to="/buy/card"
        title={t('buyWithFiat')}
        description={t('buyWithFiatDescription')}
        imageSrc={BuyWithFiatImageSrc}
        testID={DepositModalSelectors.buyWithFiat}
        paymentIcons
      />

      <DepositOption
        to="/buy/crypto"
        title={t('crossChainSwap')}
        description={t('crossChainSwapDescription')}
        imageSrc={CrossChainSwapImageSrc}
        testID={DepositModalSelectors.crossChainSwap}
      />
    </div>
  </MiniPageModal>
));
