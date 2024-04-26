import BigNumber from 'bignumber.js';

import { TempleChainKind } from 'temple/types';

import { StoredAccount, StoredHDGroup, TempleAccountType } from './types';

export function usdToAssetAmount(
  usd?: BigNumber,
  assetUsdPrice?: number,
  assetDecimals?: number,
  roundingMode?: BigNumber.RoundingMode
) {
  return !usd || assetUsdPrice === undefined
    ? undefined
    : usd.div(assetUsdPrice).decimalPlaces(assetDecimals || 0, roundingMode ?? BigNumber.ROUND_DOWN);
}

export function tzToMutez(tz: BigNumber.Value) {
  const bigNum = new BigNumber(tz);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.times(10 ** 6).integerValue();
}

export function mutezToTz(mutez: BigNumber.Value) {
  const bigNum = new BigNumber(mutez);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.integerValue().div(10 ** 6);
}

export function atomsToTokens(x: BigNumber.Value, decimals: number) {
  return new BigNumber(x).integerValue().div(new BigNumber(10).pow(decimals));
}

export function tokensToAtoms(x: BigNumber.Value, decimals: number) {
  return new BigNumber(x).times(10 ** decimals).integerValue();
}

export function formatOpParamsBeforeSend(params: any) {
  if (params.kind === 'origination' && params.script) {
    const newParams = { ...params, ...params.script };
    newParams.init = newParams.storage;
    delete newParams.script;
    delete newParams.storage;
    return newParams;
  }
  return params;
}

export function toExcelColumnName(n: number) {
  let dividend = n + 1;
  let columnName = '';
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

function getSameGroupAccounts(allAccounts: StoredAccount[], accountType: TempleAccountType, groupId?: string) {
  return allAccounts.filter(
    acc => acc.type === accountType && (acc.type !== TempleAccountType.HD || acc.groupId === groupId)
  );
}

async function pickUniqueName(
  startIndex: number,
  getNameCandidate: (i: number) => string | Promise<string>,
  isUnique: (name: string) => boolean
) {
  for (let i = startIndex; ; i++) {
    const nameCandidate = await getNameCandidate(i);
    if (isUnique(nameCandidate)) {
      return nameCandidate;
    }
  }
}

export function isNameCollision(
  allAccounts: StoredAccount[],
  accountType: TempleAccountType,
  name: string,
  groupId?: string
) {
  return getSameGroupAccounts(allAccounts, accountType, groupId).some(acc => acc.name === name);
}

export async function fetchNewAccountName(
  allAccounts: StoredAccount[],
  newAccountType: TempleAccountType,
  getNameCandidate: (i: number) => string | Promise<string>,
  newAccountGroupId?: string
) {
  const sameGroupAccounts = getSameGroupAccounts(allAccounts, newAccountType, newAccountGroupId);

  return await pickUniqueName(
    sameGroupAccounts.length + 1,
    getNameCandidate,
    name => !isNameCollision(allAccounts, newAccountType, name, newAccountGroupId)
  );
}

export async function fetchNewGroupName(allGroups: StoredHDGroup[], getNameCandidate: (i: number) => Promise<string>) {
  return await pickUniqueName(
    allGroups.length,
    getNameCandidate,
    name => !allGroups.some(group => group.name === name)
  );
}

export function getDerivationPath(chainName: TempleChainKind, index: number) {
  if (chainName === TempleChainKind.EVM) {
    return `m/44'/60'/0'/0/${index}`;
  }

  return `m/44'/1729'/${index}'/0'`;
}
