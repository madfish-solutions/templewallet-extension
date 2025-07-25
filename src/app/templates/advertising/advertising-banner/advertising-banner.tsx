import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';

import { Anchor } from 'app/atoms/Anchor';
import { useAppEnv } from 'app/env';
import { useActivePromotionSelector } from 'app/store/advertising/selectors';

export const AdvertisingBanner: FC = () => {
  const activePromotion = useActivePromotionSelector();
  const { fullPage } = useAppEnv();

  if (!isDefined(activePromotion)) return null;

  return (
    <Anchor
      className="flex items-center justify-center mr-3"
      style={{
        height: 28,
        paddingLeft: fullPage ? 8 : 4,
        paddingRight: fullPage ? 8 : 4,
        borderRadius: 4,
        backgroundColor: '#E5F2FF'
      }}
      href={activePromotion.url}
      testID={`${activePromotion?.name}_${fullPage ? 'FULLPAGE' : 'POPUP'}_LOGO`}
      treatAsButton={true}
    >
      <img alt={activePromotion.name} src={fullPage ? activePromotion.fullPageLogoUrl : activePromotion.popupLogoUrl} />
    </Anchor>
  );
};
