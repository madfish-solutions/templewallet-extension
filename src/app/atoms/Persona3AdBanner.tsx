import React, { FC, useEffect } from 'react';

import { persona3AdClient } from 'lib/persona3-client';
//import { useAccount } from 'lib/temple/front';

interface Props {
  id: string;
  adUnitId: string;
  width: number;
  height: number;
}

export const Persona3AdBanner: FC<Props> = ({ id, adUnitId, width, height }) => {
  //const { publicKeyHash } = useAccount();

  useEffect(() => {
    //persona3AdClient.setWalletAddress(publicKeyHash);
    persona3AdClient.showBannerAd({ adUnitId, containerId: id });
  }, [adUnitId, id]);

  return <div id={id} className="object-cover max-h-full max-w-full" style={{ width, height }} />;
};
