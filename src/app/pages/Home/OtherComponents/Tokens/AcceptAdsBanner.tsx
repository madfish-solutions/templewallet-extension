import React, { FC, useCallback, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import ABContainer from 'app/atoms/ABContainer';
import { Banner, BannerButtonProps } from 'app/atoms/Banner';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { setAdsBannerVisibilityAction } from 'app/store/settings/actions';
import { T } from 'lib/i18n';
import { EmojiInlineIcon } from 'lib/icons/emoji';

import { AssetsSelectors } from '../Assets.selectors';

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
      testID: AssetsSelectors.acceptAdsBannerEnableButton,
      testIDProperties: { buttonText: 'Pay me for every ad I see' },
      onClick: onEnableButtonClick
    }),
    [onEnableButtonClick]
  );

  const disableButton: BannerButtonProps = useMemo(
    () => ({
      title: 'noThanksIhateFreeMoney',
      testID: AssetsSelectors.acceptAdsBannerDisableButton,
      testIDProperties: { buttonText: 'No thanks' },
      onClick: onDisableButtonClick
    }),
    [onDisableButtonClick]
  );

  return (
    <Banner
      title={
        <>
          <T id="acceptAdsBannerTitle_A" />
          <br />
          <EmojiInlineIcon name="eyes-1f440" />
          <EmojiInlineIcon name="money-bag-1f4b0" />
        </>
      }
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
      testID: AssetsSelectors.acceptAdsBannerEnableButton,
      testIDProperties: { buttonText: 'Enable Ads' },
      onClick: onEnableButtonClick
    }),
    [onEnableButtonClick]
  );

  const disableButton: BannerButtonProps = useMemo(
    () => ({
      title: 'disable',
      capitalize: true,
      testID: AssetsSelectors.acceptAdsBannerDisableButton,
      testIDProperties: { buttonText: 'Disable' },
      onClick: onDisableButtonClick
    }),
    [onDisableButtonClick]
  );

  return (
    <Banner
      title={<T id="acceptAdsBannerTitle_B" />}
      description="acceptAdsBannerText_B"
      enableButton={enableButton}
      disableButton={disableButton}
    />
  );
};
