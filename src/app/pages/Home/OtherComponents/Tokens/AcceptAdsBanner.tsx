import React, { FC, useCallback, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import { Banner, BannerButtonProps } from 'app/atoms/Banner';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { setAdsBannerVisibilityAction } from 'app/store/settings/actions';
import { ABTestGroup } from 'lib/apis/temple';

export const AcceptAdsBanner: FC = () => {
  const userTestingGroupName = useUserTestingGroupNameSelector();
  const dispatch = useDispatch();

  const onEnableButtonClick = useCallback(() => {
    dispatch(togglePartnersPromotionAction(true));
    dispatch(setAdsBannerVisibilityAction(false));
  }, []);

  const onDisableButtonClick = useCallback(() => {
    dispatch(togglePartnersPromotionAction(false));
    dispatch(setAdsBannerVisibilityAction(false));
  }, []);

  if (userTestingGroupName === ABTestGroup.A)
    return (
      <AcceptAdsBannerForATestGroup
        onEnableButtonClick={onEnableButtonClick}
        onDisableButtonClick={onDisableButtonClick}
      />
    );

  return (
    <AcceptAdsBannerForBTestGroup
      onEnableButtonClick={onEnableButtonClick}
      onDisableButtonClick={onDisableButtonClick}
    />
  );
};

interface Props {
  onEnableButtonClick: EmptyFn;
  onDisableButtonClick: EmptyFn;
}

const AcceptAdsBannerForATestGroup: FC<Props> = ({ onEnableButtonClick, onDisableButtonClick }) => {
  const enableButton: BannerButtonProps = useMemo(
    () => ({
      title: 'payMeForEveryAdISee',
      onClick: onEnableButtonClick
    }),
    [onEnableButtonClick]
  );

  const disableButton: BannerButtonProps = useMemo(
    () => ({
      title: 'noThanksIhateFreeMoney',
      onClick: onDisableButtonClick
    }),
    [onDisableButtonClick]
  );

  return (
    <Banner
      title={`Get paid to discover exciting services and dApps!\n👀💰`}
      description={`Here's the deal: share some data with us (wallet address, IP) to see the most relevant ads and we'll *pay you* a fair share monthly. By doing so, you support the developers of Temple Wallet. Change your mind? Easily disable sharing in settings.\n\nStart earning now!`}
      enableButton={enableButton}
      disableButton={disableButton}
    />
  );
};

const AcceptAdsBannerForBTestGroup: FC<Props> = ({ onEnableButtonClick, onDisableButtonClick }) => {
  const enableButton: BannerButtonProps = useMemo(
    () => ({
      title: 'enableAds',
      onClick: onEnableButtonClick
    }),
    [onEnableButtonClick]
  );

  const disableButton: BannerButtonProps = useMemo(
    () => ({
      onClick: onDisableButtonClick
    }),
    [onDisableButtonClick]
  );

  return (
    <Banner
      title="Earn by viewing ads in Temple Wallet"
      description="Support the development team and earn tokens by viewing ads inside the wallet. To enable this feature, we request your permission to trace your Wallet Address and IP address. You can always disable ads in the settings."
      enableButton={enableButton}
      disableButton={disableButton}
    />
  );
};
