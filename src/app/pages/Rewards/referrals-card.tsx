import React, { memo, useCallback, useMemo } from 'react';

import { IconBase, Loader, Money } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { StyledButton } from 'app/atoms/StyledButton';
import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { ReactComponent as LinkIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as InfoIcon } from 'app/icons/base/InfoFill.svg';
import { inviteAccountInfoTippyProps } from 'app/pages/Rewards/tooltip';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { fetchConversionAccount, getReferralsCount, getRefLink } from 'lib/apis/temple';
import { REFERRERS_COUNTER_SYNC_INTERVAL } from 'lib/fixed-times';
import { t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';
import useTippy from 'lib/ui/useTippy';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useAllAccounts } from 'temple/front';

import referralsImage from './assets/referrals-image.png';

export const ReferralsCard = memo(() => {
  const accounts = useAllAccounts();
  const { tezosAddress: rewardsTezosAddress, evmAddress: rewardsEvmAddress } = useRewardsAddresses();
  const inviteAccountInfoRef = useTippy<HTMLDivElement>(inviteAccountInfoTippyProps);
  const { trackEvent } = useAnalytics();

  const { data: conversionAccount } = useTypedSWR(['conversionAccount'], fetchConversionAccount, { suspense: false });
  const { data: refLink } = useTypedSWR(['refLink'], getRefLink, { suspense: false });
  const { data: referralsCount, isLoading: isReferralsCountLoading } = useTypedSWR(
    ['referralsCount'],
    () => getReferralsCount(),
    {
      suspense: false,
      refreshInterval: REFERRERS_COUNTER_SYNC_INTERVAL
    }
  );

  const onInviteLinkCopied = useCallback(() => {
    trackEvent('CopyReferralLink', AnalyticsEventCategory.ButtonPress);
  }, [trackEvent]);

  const handleCopyInviteLink = useCopyText(refLink, false, onInviteLinkCopied);

  const account = useMemo(() => {
    const rewardsAccount =
      rewardsTezosAddress || rewardsEvmAddress
        ? accounts.find(
            acc =>
              getAccountAddressForTezos(acc) === rewardsTezosAddress &&
              getAccountAddressForEvm(acc) === rewardsEvmAddress
          )
        : undefined;

    if (rewardsAccount) {
      return rewardsAccount;
    }

    if (conversionAccount) {
      return accounts.find(acc => getAccountAddressForTezos(acc) === conversionAccount.tezosAddress);
    }

    return accounts[0];
  }, [accounts, conversionAccount, rewardsEvmAddress, rewardsTezosAddress]);

  return (
    <div className="gap-3 bg-white rounded-8 p-1 flex flex-col shadow-bottom">
      <div className="rounded-6 p-3 bg-secondary-low flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="gap-1 flex flex-row items-center">
            <img src={referralsImage} alt="referrals" className="w-12 h-12 rounded-lg object-cover" />

            <div className="flex-1">
              <p className="text-font-medium-bold font-semibold">{t('referrals')}</p>
              <p className="text-font-description text-grey-1">{t('inviteFriends')}</p>
            </div>
          </div>

          <span className="text-font-num-24 font-medium mr-2">
            {isReferralsCountLoading ? (
              <Loader size="L" trackVariant="dark" className="text-secondary" />
            ) : referralsCount === undefined ? (
              '-'
            ) : (
              <Money smallFractionFont={false}>{referralsCount}</Money>
            )}
          </span>
        </div>

        <StyledButton size="M" color="secondary" onClick={handleCopyInviteLink}>
          <span className="flex items-center justify-center">
            <IconBase size={16} Icon={LinkIcon} />
            <span className="text-font-medium-bold">{t('inviteLink')}</span>
          </span>
        </StyledButton>
      </div>

      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-font-description text-grey-1">{t('inviteAccount')}</span>
          <IconBase ref={inviteAccountInfoRef} size={16} Icon={InfoIcon} className="text-grey-2" />
        </div>
        <div className="flex items-center gap-1">
          {account && (
            <>
              <AccountAvatar seed={account.id} size={24} />
              <AccountName account={account} />
            </>
          )}
        </div>
      </div>
    </div>
  );
});
