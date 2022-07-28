import React from 'react';

export interface ChangelogItem {
  version: string;
  data: Array<JSX.Element>;
}

const datav1_14_8: ChangelogItem = {
  version: '1.14.8',
  data: [
    <>Jakarta protocol testnet is up.</>,
    <>Ghostnet is now supported.</>,
    <>QuipuSwap Stable pools, Plenty Stable Swap and Plenty Volatile Swap added to the swap router.</>,
    <>Ctez pools and Vortex DOGA/TEZ pools fixed.</>,
    <>
      Import/create wallet flow changed to be more intuitive. Seed phrase confirmation process changed to bolster
      security.
    </>,
    <>Streamlined derivation path options on wallet import.</>,
    <>.xyz Tez domains are now supported.</>,
    <>Hryvna/Tez top-up added (Alice-Bob partner integration)</>,
    <>Various other UI fixes</>
  ]
};

const datav1_14_7: ChangelogItem = {
  version: '1.14.7',
  data: [
    <>Swap router upgrade: added Vortex DEX pools and QuipuSwap token-token pools.</>,
    <>Added Ithaca Smartpy RPC and Jakarta support</>,
    <>Exolix top-up support improvements, single swap limit increased to $10k</>,
    <>Copy Error Text button: a feature to make error reports easier.</>,
    <strong>Groundwork done for Temple desktop and Temple mobile sync.</strong>,
    <>Other security and UI improvements!</>
  ]
};

const allVersions = [datav1_14_8, datav1_14_7];

export const changelogData = {
  changelog: allVersions
};
