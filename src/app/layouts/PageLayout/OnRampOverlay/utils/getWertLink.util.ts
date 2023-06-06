export const getWertLink = (address: string, amount = 0) =>
  `https://sandbox.wert.io/01H1P6HP2CEFR97GDJVYTS15AF/widget/?currency_amount=${amount}&commodity=XTZ%3ATezos&currency=USD&address=${address}&commodities=XTZ%3ATezos`;
