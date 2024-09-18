import React, { FC, useRef, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
//import { ConfirmData } from 'app/pages/Send/form/interfaces';

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

  return (
    <PageModal title="Confirm Send" opened={opened} onRequestClose={onRequestClose}>
      <div className="px-4 flex flex-col flex-1">
        <div className="flex flex-col justify-center items-center py-4">
          <span>token Icon</span>
          <span>send amount</span>
          <span>amount in fiat</span>
        </div>

        <CurrentAccount />

        <SegmentedControl
          name="confirm-send-tabs"
          setActiveSegment={val => setTab(val)}
          controlRef={useRef<HTMLDivElement>(null)}
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

        {(() => {
          switch (tab) {
            case 'Fee':
              return <FeeTab />;
            case 'Advanced':
              return <AdvancedTab />;
            default:
              return <DetailsTab />;
          }
        })()}

        <div className="flex-1 flex flex-col overflow-y-auto">Content</div>
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
