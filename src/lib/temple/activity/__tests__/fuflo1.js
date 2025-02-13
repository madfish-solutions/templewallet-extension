const lodash = require('lodash');
const vitalikActivityPart1 = require('./vitalik-activity-part1.json');
const vitalikActivityPart2 = require('./vitalik-activity-part2.json');

const getKey = ({ chainId, contract, tokenId }) => `${chainId}-${contract}-${tokenId}`;

const assets = lodash.uniqBy(
  vitalikActivityPart2
    // .concat(vitalikActivityPart2)
    .map(({ chainId, operations }) => operations.map(({ asset: { amountSigned, ...asset } }) => asset ? { ...asset, chainId } : undefined))
    .flat()
    .filter(x => x),
  (asset) => getKey(asset)
);

console.log('assets', JSON.stringify(assets, null, 2));

/* const [dbVitalikActivityPart1, dbVitalikActivityPart2] = [vitalikActivityPart1, vitalikActivityPart2].map(
  part => part.map(({ chainId, blockHeight, operations, ...activity }) => ({
    ...activity,
    chainId,
    blockHeight: +blockHeight,
    operations: operations.map(({ asset: { amountSigned, ...asset }, ...operation }) => ({
      ...operation,
      amountSigned,
      fkAsset: assets.findIndex(x => getKey(x) === getKey({ ...asset, chainId })) + 1
    }))
  }))
);

console.log('dbVitalikActivityPart1', JSON.stringify(dbVitalikActivityPart1, null, 2));
console.log('dbVitalikActivityPart2', JSON.stringify(dbVitalikActivityPart2, null, 2)); */

/* let interactionsCounters = {};
vitalikActivityPart1.concat(vitalikActivityPart2).forEach(({ operations }) => {
  operations.forEach(({ fromAddress, toAddress }) => [fromAddress, toAddress].forEach(address => {
    if (address !== '0xab5801a7d398351b8be11c439e05c5b3259aec9b') {
      interactionsCounters[address] = (interactionsCounters[address] || 0) + 1;
    }
  }))
});

console.log(JSON.stringify(interactionsCounters, null, 2)); */

/* const vitalikAssets = require('./vitalik-activity-parts-assets.json');
const otherAssets = require('./interactor-activity-assets.json');
const activity = require('./interactor-activity.json');

const assets = vitalikAssets.concat(otherAssets);

const dbActivities = activity.map(({ chainId, blockHeight, operations, ...activity }) => ({
  ...activity,
  chainId,
  blockHeight: +blockHeight,
  operations: operations.map(({ asset: { amountSigned, ...asset }, ...operation }) => ({
    ...operation,
    amountSigned,
    fkAsset: assets.findIndex(x => x.chainId === chainId && x.contract === asset.contract && x.tokenId === asset.tokenId) + 1
  }))
}));

console.log('dbActivities', JSON.stringify(dbActivities, null, 2)); */
