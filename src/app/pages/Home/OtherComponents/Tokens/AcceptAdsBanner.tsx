import React, { FC, useCallback, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import ABContainer from 'app/atoms/ABContainer';
import { Banner, BannerButtonProps } from 'app/atoms/Banner';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { setAdsBannerVisibilityAction } from 'app/store/settings/actions';

export const AcceptAdsBanner: FC = () => {
  const dispatch = useDispatch();

  const onEnableButtonClick = useCallback(() => {
    dispatch(togglePartnersPromotionAction(true));
    dispatch(setAdsBannerVisibilityAction(false));
  }, [dispatch]);

  const onDisableButtonClick = useCallback(() => {
    dispatch(togglePartnersPromotionAction(false));
    dispatch(setAdsBannerVisibilityAction(false));
  }, [dispatch]);

  return (
    <ABContainer
      groupAComponent={
        <AcceptAdsBannerForTestGroupA
          onEnableButtonClick={onEnableButtonClick}
          onDisableButtonClick={onDisableButtonClick}
        />
      }
      groupBComponent={
        <AcceptAdsBannerForTestGroupB
          onEnableButtonClick={onEnableButtonClick}
          onDisableButtonClick={onDisableButtonClick}
        />
      }
    />
  );
};

interface Props {
  onEnableButtonClick: EmptyFn;
  onDisableButtonClick: EmptyFn;
}

const AcceptAdsBannerForTestGroupA: FC<Props> = ({ onEnableButtonClick, onDisableButtonClick }) => {
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
      title="acceptAdsBannerTitle_A"
      description="acceptAdsBannerText_A"
      enableButton={enableButton}
      disableButton={disableButton}
    />
  );
};

const AcceptAdsBannerForTestGroupB: FC<Props> = ({ onEnableButtonClick, onDisableButtonClick }) => {
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
      title="acceptAdsBannerTitle_B"
      description="acceptAdsBannerText_B"
      enableButton={enableButton}
      disableButton={disableButton}
    />
  );
};
