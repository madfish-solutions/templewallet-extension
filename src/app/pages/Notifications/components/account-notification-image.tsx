import { FC, useEffect, useState } from 'react';

import { OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL, subscribeAccountNotificationImageSrc } from 'lib/notifications';

interface Props {
  src: string;
  className?: string;
}

export const AccountNotificationImage: FC<Props> = ({ src, className }) => {
  const [currentSrc, setCurrentSrc] = useState(OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL);

  useEffect(() => subscribeAccountNotificationImageSrc(src, setCurrentSrc), [src]);

  return <img src={currentSrc} alt="" className={className} />;
};
