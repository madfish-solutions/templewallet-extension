import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useKnownBakerOrPayoutAccount } from 'lib/temple/front';
import { Image } from 'lib/ui/Image';

import { RobotIcon } from './robot-icon';

interface Props {
  bakerAddress: string;
}

export const BakerLogo: FC<Props> = ({ bakerAddress }) => {
  const { data: bakerOrPayoutAccount } = useKnownBakerOrPayoutAccount(bakerAddress);

  if (isDefined(bakerOrPayoutAccount)) {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 mr-2">
        <Image
          src={bakerOrPayoutAccount.logo}
          loader={<RobotIcon hash={bakerAddress} />}
          fallback={<RobotIcon hash={bakerAddress} />}
          alt={bakerOrPayoutAccount.name}
          style={{
            objectFit: 'contain',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          height={36}
          width={36}
        />
      </div>
    );
  }

  return <RobotIcon hash={bakerAddress} className="border border-gray-300 mr-2" />;
};
