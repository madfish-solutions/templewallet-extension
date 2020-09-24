import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { WindowType } from "app/env";
import App from "app/App";
import { TezosToolkit } from "@taquito/taquito";
import TransportWebAuthn from "@ledgerhq/hw-transport-webauthn";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";

ReactDOM.render(
  <App env={{ windowType: WindowType.FullPage }} />,
  document.getElementById("root")
);

(window as any).connectLedger = async () => {
  const transport = await TransportWebAuthn.create();
  const signer = new LedgerSigner(
    transport,
    getMainDerivationPath(0),
    true,
    DerivationType.tz1
  );
  const tezos = new TezosToolkit();
  tezos.setProvider({ signer, rpc: "https://api.tez.ie/rpc/carthagenet" });
  // const publicKey = await tezos.signer.publicKey();
  // const publicKeyHash = await tezos.signer.publicKeyHash();
  // console.info({ publicKey, publicKeyHash });

  // console.info(
  //   await tezos.signer.sign(
  //     "f8f9b125f7ef6bbae5ee27f4612220ac93aa7c392ac5f548d15e18c2bd9a7d926c00075da6a7c0ec09c550623fefd8a9cdf40d3d9910ad8100e1dc5fbc500001000012548f71994cb2ce18072d0dcb568fe35fb7493000"
  //   )
  // );

  const op = await tezos.contract.transfer({
    to: "tz1arp2HqaDXyxgKJAdwSzvnCm3U2Gak8M1p",
    amount: 10,
  });
  console.info(op);
};

const TEZOS_BIP44_COINTYPE = 1729;
function getMainDerivationPath(accIndex: number) {
  return `m/44'/${TEZOS_BIP44_COINTYPE}'/${accIndex}'/0'`;
}
