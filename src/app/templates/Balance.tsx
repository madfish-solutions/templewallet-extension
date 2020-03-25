import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import CSSTransition from "react-transition-group/CSSTransition";
import { useBalance } from "lib/thanos/front";

type BalanceProps = {
  address: string;
  children: (b: BigNumber) => React.ReactElement;
};

const Balance = React.memo<BalanceProps>(({ address, children }) => {
  const { data: balance } = useBalance(address);
  const exist = balance !== undefined;

  return React.useMemo(
    () => (
      <CSSTransition
        in={exist}
        timeout={200}
        classNames={{
          enter: "opacity-0",
          enterActive: classNames(
            "opacity-100",
            "transition ease-out duration-200"
          ),
          exit: classNames("opacity-0", "transition ease-in duration-200")
        }}
      >
        <div className={classNames("inline-block", !exist && "invisible")}>
          {children(exist ? balance! : new BigNumber(0))}
        </div>
      </CSSTransition>
    ),
    [children, exist, balance]
  );
});

export default Balance;
