import React, { ChangeEvent, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { setAcceptedTermsVersionAction, setReferralLinksEnabledAction } from 'app/store/settings/actions';
import { useAcceptedTermsVersionSelector, useReferralLinksEnabledSelector } from 'app/store/settings/selectors';
import {
  PRIVACY_POLICY_URL,
  RECENT_TERMS_VERSION,
  TERMS_OF_USE_URL,
  TERMS_WITH_REFERRALS_VERSION
} from 'lib/constants';
import { t, T } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const useReferralLinksSettings = () => {
  const dispatch = useDispatch();
  const enabled = useReferralLinksEnabledSelector();
  const acceptedTermsVersion = useAcceptedTermsVersionSelector();
  const confirm = useConfirm();

  const setEnabled = useCallback(
    async (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
      event?.preventDefault();

      if (toChecked && acceptedTermsVersion < TERMS_WITH_REFERRALS_VERSION) {
        const confirmed = await confirm({
          title: <T id="confirmEnableReferralLinksTitle" />,
          description: (
            <T
              id="confirmEnableReferralLinksDescription"
              substitutions={[
                <a
                  href={TERMS_OF_USE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  <T id="termsOfUsage" key="termsLink" />
                </a>,
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  <T id="privacyPolicy" key="privacyPolicyLink" />
                </a>
              ]}
            />
          ),
          comfirmButtonText: t('agreeAndContinue')
        });

        if (!confirmed) {
          return;
        }
      }

      dispatch(setAcceptedTermsVersionAction(RECENT_TERMS_VERSION));
      dispatch(setReferralLinksEnabledAction(toChecked));
    },
    [acceptedTermsVersion, confirm, dispatch]
  );

  return { isEnabled: enabled, setEnabled };
};
