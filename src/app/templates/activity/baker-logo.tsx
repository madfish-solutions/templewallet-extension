import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useKnownBakerOrPayoutAccount } from 'lib/temple/front';
import { Image } from 'lib/ui/Image';

import { RobotIcon } from './robot-icon';

interface Props {
  bakerAddress: string;
}

export const BakerLogo: FC<Props> = ({ bakerAddress }) => {
  const bakerOrPayoutAccount = useKnownBakerOrPayoutAccount(bakerAddress, false);

  if (!isDefined(bakerOrPayoutAccount)) {
    return <RobotIcon hash={bakerAddress} className="border border-gray-300 mr-2" />;
  }

  return (
    <Image
      src={bakerOrPayoutAccount.logo ?? undefined}
      loader={<RobotIcon hash={bakerAddress} />}
      fallback={<RobotIcon hash={bakerAddress} />}
      alt={bakerOrPayoutAccount.name}
      className="object-contain max-w-full max-h-full mr-2"
      height={36}
      width={36}
    />
  );
};
