import React, { memo, useCallback, useMemo } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { browser } from 'lib/browser';
import { T } from 'lib/i18n';

import { ListForSaleModalSelectors } from './selectors';

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: EmptyFn;
  contractAddress: string;
  tokenId: string;
}

const OBJKT_BASE_URL = 'https://objkt.com';

const buildObjktListingUrl = (contractAddress: string, tokenId: string) =>
  `${OBJKT_BASE_URL}/tokens/${contractAddress}/${tokenId}`;

export const ListForSaleModal = memo<ListForSaleModalProps>(({ isOpen, onClose, contractAddress, tokenId }) => {
  const objktListingUrl = useMemo(() => buildObjktListingUrl(contractAddress, tokenId), [contractAddress, tokenId]);
  const testIDProperties = useMemo(() => ({ contractAddress, tokenId }), [contractAddress, tokenId]);

  const handleGoToMarketplace = useCallback(async () => {
    onClose();
    await browser.tabs.create({ url: objktListingUrl });
  }, [onClose, objktListingUrl]);

  if (!isOpen) return null;

  return (
    <ActionModal
      className="outline-hidden"
      contentClassName="pt-5 pb-1 border-none"
      title={<T id="redirectingToObjkt" />}
      closeButtonTestID={ListForSaleModalSelectors.closeButton}
      onClose={onClose}
    >
      <ActionModalBodyContainer className="pt-0!">
        <p className="mt-1 text-font-description text-grey-1 text-center whitespace-pre-line">
          <T id="listForSaleRedirectDescription" />
        </p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer className="pb-4 flex-col gap-2.5">
        <ActionModalButton
          color="primary"
          onClick={handleGoToMarketplace}
          testID={ListForSaleModalSelectors.goToMarketplaceButton}
          testIDProperties={testIDProperties}
        >
          <div className="flex items-center justify-center gap-0.5">
            <T id="goToMarketplace" />
          </div>
        </ActionModalButton>
        <ActionModalButton
          color="secondary-low"
          onClick={handleGoToMarketplace}
          testID={ListForSaleModalSelectors.redirectWithListInWalletButton}
          testIDProperties={testIDProperties}
        >
          <div className="flex items-center justify-center gap-0.5 text-center">
            <T id="redirectButListInWallet" />
          </div>
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});
