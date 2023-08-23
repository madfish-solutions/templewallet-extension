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
    <div className="mr-2">
      <Image
        src={bakerOrPayoutAccount.logo ?? undefined}
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
};
