import { Baker } from 'lib/temple/front';

export const getBakerAddress = (bakerOrAddress: string | Baker) =>
  typeof bakerOrAddress === 'string' ? bakerOrAddress : bakerOrAddress.address;
