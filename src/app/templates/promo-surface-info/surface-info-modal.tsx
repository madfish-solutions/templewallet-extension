import { FC } from 'react';

import { Anchor, IconBase } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { PROMO_PRIVACY_POLICY_URL } from 'lib/constants';
import { t, T, TID } from 'lib/i18n';

import { AiAdExample, BrowsingAdExample, InWalletAdExample } from './surface-info-examples';

export type SurfaceInfoId = 'in-wallet' | 'browsing' | 'ai';

interface SurfaceInfoContent {
  title: string;
  Example: FC;
  descriptionI18nKey: TID;
  dataUsageDescriptionI18nKey: TID;
}

const SURFACE_INFO: Record<SurfaceInfoId, SurfaceInfoContent> = {
  'in-wallet': {
    title: t('promoInWallet'),
    Example: InWalletAdExample,
    descriptionI18nKey: 'inWalletAdsModalDescription',
    dataUsageDescriptionI18nKey: 'inWalletAdsUsedData'
  },
  browsing: {
    title: t('promoWhileBrowsing'),
    Example: BrowsingAdExample,
    descriptionI18nKey: 'browsingAdsModalDescription',
    dataUsageDescriptionI18nKey: 'browsingAdsCollectedData'
  },
  ai: {
    title: t('promoWhileUsingAi'),
    Example: AiAdExample,
    descriptionI18nKey: 'aiAdsModalDescription',
    dataUsageDescriptionI18nKey: 'aiAdsCollectedData'
  }
};

interface Props {
  surface: SurfaceInfoId;
  onClose: EmptyFn;
  closeButtonTestID: string;
  gotItButtonTestID: string;
  privacyLinkTestID: string;
}

export const SurfaceInfoModal: FC<Props> = ({
  surface,
  onClose,
  closeButtonTestID,
  gotItButtonTestID,
  privacyLinkTestID
}) => {
  const { title, Example, descriptionI18nKey, dataUsageDescriptionI18nKey } = SURFACE_INFO[surface];

  return (
    <ActionModal title={title} onClose={onClose} closeButtonTestID={closeButtonTestID}>
      <ActionModalBodyContainer className="pt-3! gap-4 items-center">
        <div className="w-full flex flex-col gap-1">
          <p className="py-1 text-font-description-bold">Example</p>
          <Example />
        </div>

        <div className="w-full flex flex-col gap-1">
          <p className="py-1 text-font-description text-grey-1 text-center">
            <T id={descriptionI18nKey} />
          </p>
          <p className="py-1 text-font-description text-grey-1 text-center">
            <T id={dataUsageDescriptionI18nKey} />
          </p>
        </div>

        <Anchor
          href={PROMO_PRIVACY_POLICY_URL}
          className="flex items-center px-1 py-0.5 rounded-sm text-secondary text-font-description-bold"
          onClick={onClose}
          testID={privacyLinkTestID}
        >
          More about Privacy Policy
          <IconBase Icon={OutLinkIcon} size={12} className="text-secondary" />
        </Anchor>
      </ActionModalBodyContainer>

      <ActionModalButtonsContainer className="pb-4">
        <ActionModalButton color="primary" onClick={onClose} testID={gotItButtonTestID}>
          Got it
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
};
