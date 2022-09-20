import BigNumber from 'bignumber.js';

type ParameterFa12 = {
  entrypoint: string;
  value: {
    to: string;
    from: string;
    value: string;
  };
};
interface Fa2Transaction {
  to_: string;
  amount: string;
  token_id: string;
}
interface Fa2OpParams {
  txs: Fa2Transaction[];
  from_: 'tz1h85hgb9hk4MmLuouLcWWna4wBLtqCq4Ta';
}
type ParameterFa2 = {
  entrypoint: string;
  value: Fa2OpParams[];
};

export function tryParseTokenTransfers(
  parameter: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) {
  // FA1.2
  try {
    formatFa12(parameter, destination, onTransfer);
  } catch {}

  // FA2
  try {
    formatFa2(parameter, destination, onTransfer);
  } catch {}
}

export function isPositiveNumber(val: BigNumber.Value) {
  return new BigNumber(val).isGreaterThan(0);
}

export function toTokenId(contractAddress: string, tokenId: string | number = 0) {
  return `${contractAddress}_${tokenId}`;
}

export function getTzktTokenTransferId(hash: string, nonce?: number) {
  const nonceStr = nonce ? `_${nonce}` : '';
  return `${hash}${nonceStr}`;
}

const formatFa12 = (
  parameter: ParameterFa12,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) => {
  const { entrypoint, value } = parameter;
  if (entrypoint !== 'transfer') return;

  const { from, to, value: amount } = value;

  onTransfer(toTokenId(destination), from, to, amount);
};

const formatFa2 = (
  parameter: ParameterFa2,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) => {
  const { entrypoint, value: values } = parameter;
  if (entrypoint !== 'transfer') return;

  for (const value of values) {
    const from = value.from_;

    for (const tx of value.txs) {
      onTransfer(toTokenId(destination, tx.token_id), from, tx.to_, tx.amount);
    }
  }
};
