import React, { FC, useMemo } from 'react';

import { ReactComponent as AuctionIcon } from '../../../icons/auction.svg';
import { ReactComponent as GiftIcon } from '../../../icons/gift.svg';
import { ReactComponent as MailIcon } from '../../../icons/mail.svg';
import { ReactComponent as NftIcon } from '../../../icons/nft.svg';
import { ActivityType } from '../ActivityNotifications/ActivityNotifications.interface';
import { NotificationsIcon, NotificationsIconProps } from './NotificationsIcon';

interface ActivityIconProps extends Pick<NotificationsIconProps, 'isDotVisible'> {
  type: ActivityType;
}

export const ActivityIcon: FC<ActivityIconProps> = ({ isDotVisible, type }) => {
  const icon = useMemo(() => {
    switch (type) {
      case ActivityType.BakerRewards:
        return <GiftIcon />;
      case ActivityType.CollectibleSold:
      case ActivityType.CollectiblePurchased:
      case ActivityType.CollectibleResold:
      case ActivityType.CollectibleSellOffer:
        return <NftIcon />;
      case ActivityType.BidMade:
      case ActivityType.BidReceived:
      case ActivityType.BidOutbited:
        return <AuctionIcon />;

      default:
        return <MailIcon />;
    }
  }, [type]);

  return <NotificationsIcon isDotVisible={isDotVisible}>{icon}</NotificationsIcon>;
};
