import React, { ChangeEvent, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { setReferralLinksEnabledAction } from 'app/store/settings/actions';
import { useReferralLinksEnabledSelector } from 'app/store/settings/selectors';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'lib/constants';
import { t, T } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const useReferralLinksSettings = () => {
  const dispatch = useDispatch();
  const enabled = useReferralLinksEnabledSelector();
  const confirm = useConfirm();

  const setEnabled = useCallback(
    async (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
      event?.preventDefault();

      if (toChecked) {
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
          confirmButtonText: t('agreeAndContinue'),
          hasCancelButton: false
        });

        if (!confirmed) {
          return;
        }
      }

      dispatch(setReferralLinksEnabledAction(toChecked));
    },
    [confirm, dispatch]
  );

  return { isEnabled: enabled, setEnabled };
};
