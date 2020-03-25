import * as React from "react";
import BigNumber from "bignumber.js";

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
};

const Money: React.FC<MoneyProps> = ({ children, fiat }) => (
  <>{round(+children, fiat ? 2 : 4)}</>
);

export default Money;

function round(val: number, decPlaces: any = 4) {
  return Number(`${Math.round(+`${val}e${decPlaces}`)}e-${decPlaces}`);
}
