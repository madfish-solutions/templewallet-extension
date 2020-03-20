import * as React from "react";
import BigNumber from "bignumber.js";
import { useBalance } from "lib/thanos/front";

type Balance = string | number | BigNumber;

type BalanceProps = {
  address: string;
  children: (balance: Balance) => React.ReactElement;
};

const Balance = React.memo<BalanceProps>(({ address, children }) => (
  <React.Suspense
    fallback={<div className="inline-block invisible">{children(0)}</div>}
  >
    <PureBalance address={address} children={children} />
  </React.Suspense>
));

export default Balance;

const PureBalance: React.FC<BalanceProps> = ({ address, children }) => {
  const balance = useBalance(address);
  return React.useMemo(() => children(balance), [children, balance]);
};
