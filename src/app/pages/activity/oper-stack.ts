/* eslint-disable prettier/prettier */
/* eslint-disable import/order */

import { TzktOperation } from 'lib/tzkt/types';
import { OpStackItemType, OpStackItem } from 'lib/temple/activity/types';
import { Activity } from './utils';




export function prepOperStack(activity : Activity, accAddress : string) {
	//
	// const operStack = estimateTzktGroup(activity.tzktOperations, accAddress);

	// return operStack.sort((a, b) => a.type - b.type);
	return [];
}


interface TokenTransfers {
	assetId: string;
	from: string;
	to: string;
	amount: string;
}




////

// const estimateTzktGroup = (tzktGroup: TzktOperation[], address: string) => {
// 	const opStack : OpStackItem[] = [];

// 	for (const tzktOp of tzktGroup) {
// 		if (tzktOp.type === 'delegation' && tzktOp.sender.address === address && tzktOp.newDelegate) {
// 			opStack.push({
// 				type: OpStackItemType.Delegation,
// 				to: tzktOp.newDelegate.address
// 			});
// 		} else if (tzktOp.type === 'transaction') {
// 			if (tzktOp.parameters) {
// 				tryToParseTzktDelegationOp(tzktOp, address, opStack);
// 			} else if (isPositiveNumber(tzktOp.amount)) {
// 				addTzktSenderAddress(tzktOp, address, opStack);
// 			}
// 		} else {
// 			opStack.push({
// 				type: OpStackItemType.Other,
// 				name: tzktOp.type
// 			});
// 		}
// 	}

// 	return opStack;
// };

// const tryToParseTzktDelegationOp = (tzktOp: TzktOperation, address: string, opStack: OpStackItem[]) => {
// 	if (tzktOp.type !== 'transaction') return;
// 	if (!tzktOp.parameters) return;
// 	let parsed;
// 	try {
// 		parsed = JSON.parse(tzktOp.parameters);
// 	} catch {}

// 	if (parsed) {
// 		const tokenTransfers: TokenTransfers[] = [];
// 		tryParseTokenTransfers(parsed, tzktOp.target.address, (assetId, from, to, amount) => {
// 			tokenTransfers.push({ assetId, from, to, amount });
// 		});

// 		getTzktTransfers(tokenTransfers, tzktOp, address, opStack, parsed);
// 	}
// };

// const addTzktSenderAddress = (tzktOp: TzktOperation, address: string, opStack: OpStackItem[]) => {
// 	if (tzktOp.type !== 'transaction') return;
// 	if (tzktOp.parameters) return;
// 	if (tzktOp.sender.address === address) {
// 	opStack.push({
// 		type: OpStackItemType.TransferTo,
// 		to: tzktOp.target.address
// 	});
// 	} else if (tzktOp.target.address === address) {
// 	opStack.push({
// 		type: OpStackItemType.TransferFrom,
// 		from: tzktOp.sender.address
// 	});
// 	}
// };