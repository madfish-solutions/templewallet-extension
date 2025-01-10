import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';

import { Anchor } from 'app/atoms/Anchor';
import { useAppEnv } from 'app/env';
import { useActivePromotionSelector } from 'app/store/advertising/selectors';

export const AdvertisingBanner: FC = () => {
  const activePromotion = useActivePromotionSelector();
  const { popup } = useAppEnv();

  if (!isDefined(activePromotion)) return null;

  return (
    <Anchor
      className="flex items-center justify-center"
      style={{
        height: 28,
        paddingLeft: popup ? 4 : 8,
        paddingRight: popup ? 4 : 8,
        borderRadius: 4,
        backgroundColor: '#E5F2FF'
      }}
      href={activePromotion.url}
      testID={`${activePromotion?.name}_${popup ? 'POPUP' : 'FULLPAGE'}_LOGO`}
      treatAsButton={true}
    >
      <img alt={activePromotion.name} src={popup ? activePromotion.popupLogoUrl : activePromotion.fullPageLogoUrl} />
    </Anchor>
  );
};
