import React, { FC } from 'react';

import { IconBase, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import Identicon from 'app/atoms/Identicon';
import { StyledButton } from 'app/atoms/StyledButton';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { T, t } from 'lib/i18n';
import { useAccountForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { SelectAssetButton } from './SelectAssetButton';
import { SendFormSelectors } from './selectors';

interface Props {
  chainId: number;
  assetSlug: string;
  onSelectMyAccountClick: EmptyFn;
  onSelectAssetClick: EmptyFn;
  onAddContactRequested: (address: string) => void;
}

export const EvmForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick, onSelectMyAccountClick }) => {
  const account = useAccountForEvm();
  const network = useEvmChainByChainId(chainId);

  if (!account || !network) throw new DeadEndBoundaryError();

  const accountPkh = account.address as HexString;

  return (
    <>
      <div className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <div className="text-font-description-bold mb-2">
          <T id="token" />
        </div>

        <SelectAssetButton
          selectedAssetSlug={assetSlug}
          network={network}
          accountPkh={accountPkh}
          onClick={onSelectAssetClick}
          className="mb-4"
          testID={SendFormSelectors.selectAssetButton}
        />

        <form id="send-form">
          <AssetField
            label={t('amount')}
            placeholder="0.00"
            containerClassName="mb-8"
            testID={SendFormSelectors.amountInput}
          />

          <NoSpaceField
            textarea
            showPasteButton
            rows={3}
            id="send-to"
            label={t('recipient')}
            placeholder="Address or Domain name"
            style={{ resize: 'none' }}
            containerClassName="mb-4"
            testID={SendFormSelectors.recipientInput}
          />

          <div
            className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
            onClick={onSelectMyAccountClick}
          >
            <div className="flex justify-center items-center gap-2">
              <div className="flex p-px rounded-md border border-secondary">
                <Identicon type="bottts" hash="selectaccount" size={20} />
              </div>
              <span className="text-font-medium-bold">Select My Account</span>
            </div>
            <IconBase Icon={CompactDown} className="text-primary" size={16} />
          </div>
        </form>
      </div>

      <div className="flex flex-col pt-4 px-4 pb-6">
        <StyledButton type="submit" form="send-form" size="L" color="primary" testID={SendFormSelectors.sendButton}>
          Review
        </StyledButton>
      </div>
    </>
  );
};
