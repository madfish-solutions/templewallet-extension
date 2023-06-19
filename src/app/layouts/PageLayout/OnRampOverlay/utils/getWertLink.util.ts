export const getWertLink = (address: string, amount = 0) =>
  `https://widget.wert.io/01H28HR1AXVTAD3AXW3DDFDY2Y/widget/?currency_amount=${amount}&commodity=XTZ%3ATezos&currency=USD&address=${address}&commodities=XTZ%3ATezos`;
