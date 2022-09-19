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

/**
 * @deprecated
 */
export function _tryParseTokenTransfers(
  parameters: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) {
  // FA1.2
  try {
    formatFa12(parameters, destination, onTransfer);
  } catch {}

  // FA2
  try {
    formatFa2(parameters, destination, onTransfer);
  } catch {}
}

/**
 * @deprecated
 */
const _formatFa12 = (
  parameters: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) => {
  const { entrypoint, value } = parameters;
  if (entrypoint === 'transfer') {
    let from, to, amount: string | undefined;

    const { args: x } = value;
    if (typeof x[0].string === 'string') {
      from = x[0].string;
    }
    const { args: y } = x[1];
    if (typeof y[0].string === 'string') {
      to = y[0].string;
    }
    if (typeof y[1].int === 'string') {
      amount = y[1].int;
    }

    if (from && to && amount) {
      onTransfer(toTokenId(destination), from, to, amount);
    }
  }
};

/**
 * @deprecated
 */
const _formatFa2 = (
  parameters: any,
  destination: string,
  onTransfer: (tokenId: string, from: string, to: string, amount: string) => void
) => {
  const { entrypoint, value } = parameters;
  if (entrypoint !== 'transfer') return;
  for (const { args: x } of value) {
    let from: string | undefined;

    from = checkIfVarString(x);
    for (const { args: y } of x[1]) {
      let to, tokenId, amount: string | undefined;

      to = checkIfVarString(y);
      tokenId = checkDestination(y[1].args[0], destination);
      amount = checkIfIntString(y[1].args[1]);

      if (from && to && tokenId && amount) {
        onTransfer(tokenId, from, to, amount);
      }
    }
  }
};

const checkIfVarString = (x: any) => (typeof x[0].string === 'string' ? x[0].string : undefined);

const checkIfIntString = (x: any) => (typeof x.int === 'string' ? x.int : undefined);

const checkDestination = (x: any, destination: string) =>
  typeof x.int === 'string' ? toTokenId(destination, x.int) : undefined;
