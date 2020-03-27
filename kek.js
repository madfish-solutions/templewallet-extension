const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const RPC = "https://carthagenet.tezos.org.ua";
const SK = "edsk3rjgug53LbMaMbmGoUoPMnRxTLAqFxxoU2J26PSV44orTk2ihv";

(async () => {
  try {
    const signer = await InMemorySigner.fromSecretKey(SK);
    const tezos = new TezosToolkit();
    tezos.setProvider({ rpc: RPC, signer });

    const to = "tz1Rt6ockzzdVoUhExAVLn1vkL1apn5ULvMx";
    const amount = 100;

    const op = await tezos.contract.transfer({ to, amount });
    console.info(op);

    await op.confirmation();
  } catch (err) {
    console.error(err);
  }
})();
