import React, { FC, useCallback, useRef, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { EvmTokenIconWithNetwork } from 'app/templates/AssetIcon';
import { T } from 'lib/i18n';

import { CurrentAccount } from './CurrentAccount';
import { AdvancedTab } from './tabs/Advanced';
import { DetailsTab } from './tabs/Details';
import { FeeTab } from './tabs/Fee';

interface ConfirmSendModalProps {
  //data?: ConfirmData;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const ConfirmSendModal: FC<ConfirmSendModalProps> = ({ opened, onRequestClose }) => {
  const [tab, setTab] = useState('details');

  const activeIndexRef = useRef<number | null>(null);

  const goToFeeTab = useCallback(() => {
    activeIndexRef.current = 1;
    setTab('fee');
  }, []);

  return (
    <PageModal title="Confirm Send" opened={opened} onRequestClose={onRequestClose}>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="flex flex-col justify-center items-center text-center my-4">
          <EvmTokenIconWithNetwork evmChainId={1} assetSlug="eth" className="mb-2" />
          <span className="text-font-num-bold-14">0.44443</span>
          <span className="text-font-num-12 text-grey-1">12345.33$</span>
        </div>

        <CurrentAccount />

        <SegmentedControl
          name="confirm-send-tabs"
          setActiveSegment={val => setTab(val)}
          controlRef={useRef<HTMLDivElement>(null)}
          activeIndexRef={activeIndexRef}
          className="mt-6 mb-4"
          segments={[
            {
              label: 'Details',
              value: 'details',
              ref: useRef<HTMLDivElement>(null)
            },
            {
              label: 'Fee',
              value: 'fee',
              ref: useRef<HTMLDivElement>(null)
            },
            {
              label: 'Advanced',
              value: 'advanced',
              ref: useRef<HTMLDivElement>(null)
            }
          ]}
        />

        <div className="flex-1 flex flex-col">
          {(() => {
            switch (tab) {
              case 'fee':
                return <FeeTab />;
              case 'advanced':
                return <AdvancedTab />;
              default:
                return <DetailsTab goToFeeTab={goToFeeTab} />;
            }
          })()}
        </div>
      </div>
      <ActionsButtonsBox flexDirection="row" className="gap-x-2.5">
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onRequestClose}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton size="L" className="w-full" color="primary">
          <T id="confirm" />
        </StyledButton>
      </ActionsButtonsBox>
    </PageModal>
  );
};
