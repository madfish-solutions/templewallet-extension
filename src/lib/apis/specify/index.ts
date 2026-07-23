import Specify, { ImageFormat, SpecifyAd } from '@specify-sh/sdk';
import { isAddress } from 'viem';

import { EnvVars } from 'lib/env';

export { ImageFormat as SpecifyImageFormat };
export type { SpecifyAd };

let client: Specify | null | undefined;

const getSpecifyClient = () => {
  if (client === undefined) {
    try {
      client = EnvVars.SPECIFY_PUBLISHER_KEY ? new Specify({ publisherKey: EnvVars.SPECIFY_PUBLISHER_KEY }) : null;
    } catch (e) {
      console.error(e);
      client = null;
    }
  }

  return client;
};

export const serveSpecifyAd = async (
  accountAddress: string,
  imageFormat: ImageFormat,
  adUnitId: string
): Promise<SpecifyAd | null> => {
  const specify = getSpecifyClient();

  if (!specify || !isAddress(accountAddress)) {
    return null;
  }

  try {
    return await specify.serve(accountAddress, { imageFormat, adUnitId });
  } catch (e) {
    console.error(e);

    return null;
  }
};
