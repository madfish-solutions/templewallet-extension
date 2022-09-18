/* eslint-disable prettier/prettier */


import { BigNumber } from 'bignumber.js';

import type {
	_TzktOperation,
	TzktOperation,
	TzktAlias as MemberInterface,
} from 'lib/tzkt/types';


////

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
type ParamterFa2 = {
	entrypoint: string;
	value: Fa2OpParams[];
};
type ParameterLiquidityBaking = {
	entrypoint: string;
	value: {
		target: string;
		quantity: string; // can be 'number' or '-number
	};
};


////

export interface OperGroup {
	hash : string;
	operations : TzktOperation[];
}

export interface Activity {
	hash : string;
	addedAt : string; // : ISO string
	status: ActivityStatus;
	/**
	 * Sorted new-to-old
	 */
	tzktOperations : TzktOperation[];
	/**
	 * Sorted new-to-old
	 */
	// operations : ActivityOperation[];
	// oldestTzktOperId : number;
};

type ActivityStatus = TzktOperation['status'] | 'pending';

export interface ActivityOperation {
	type: TzktOperation['type'];
	status: ActivityStatus;
	hash: string;
	amount: string;
	address?: string;
	id: number;
	tokenId?: string;
	timestamp: number;
	entrypoint?: string;
	source: MemberInterface;
	destination: MemberInterface;
	level?: number;
}


////
export function operGroupToActivity(
	{ hash, operations } : OperGroup,
	address : string,
) : Activity {
	const firstOperation = operations[0]!, lastOperation = operations[operations.length-1]!;
	const addedAt = firstOperation.timestamp;
	const status = firstOperation.status;
	// const oldestTzktOperId = lastOperation.id;
	// const activityOperations = reduceActivityOperations(address, operations as _TzktOperation[]);
	//
	return {
		hash,
		addedAt,
		status,
		tzktOperations: operations,
		// operations: activityOperations,
		// oldestTzktOperId,
	};
}

export const reduceActivityOperations = (address: string, operations: _TzktOperation[]) => {
	const activities : ActivityOperation[] = [];

	for(const operation of operations) {
		const {
			id,
			type,
			status,
			hash,
			timestamp,
			entrypoint,
			contractBalance,
			sender,
			target,
			level,
			newDelegate,
			originatedContract,
			parameter
		} = operation;

		const source = sender;
		let destination: MemberInterface = { address: '' };
		let amount = '0';
		let tokenId = null;
		let contractAddress = null;

		switch(type) {
			case 'transaction':
				destination = target;
				amount = operation.amount.toString();
				const fa2Parameter = parameter as ParamterFa2;
				const fa12Parameter = parameter as ParameterFa12;
				const bakingParameter = parameter as ParameterLiquidityBaking;

				if (
					isDefined(fa2Parameter) &&
					fa2Parameter.value.length > 0 &&
					Array.isArray(fa2Parameter.value) &&
					isDefined(fa2Parameter.value[0].txs)
				) {
					contractAddress = target.address;
					let isUserSenderOrReceiverOfFa2Operation = false;
					if (fa2Parameter.value[0].from_ === address) {
						amount = fa2Parameter.value[0].txs.reduce((acc, tx) => acc.plus(tx.amount), new BigNumber(0)).toFixed();
						source.address = address;
						isUserSenderOrReceiverOfFa2Operation = true;
						tokenId = fa2Parameter.value[0].txs[0].token_id;
					}
					for (const param of fa2Parameter.value) {
						const val = param.txs.find(tx => {
							return tx.to_ === address && (amount = tx.amount);
						});
						if (isDefined(val)) {
							isUserSenderOrReceiverOfFa2Operation = true;
							amount = val.amount;
							tokenId = val.token_id;
						}
					}
					if (!isUserSenderOrReceiverOfFa2Operation) {
						continue;
					}
				} else if (isDefined(fa12Parameter) && isDefined(fa12Parameter.value.value)) {
					if (fa12Parameter.entrypoint === 'approve') {
						continue;
					}
					if (isDefined(fa12Parameter.value.from) || isDefined(fa12Parameter.value.to)) {
						if (fa12Parameter.value.from === address) {
							source.address = address;
						} else if (fa12Parameter.value.to === address) {
							source.address = fa12Parameter.value.from;
						} else {
							continue;
						}
					}
					contractAddress = target.address;
					amount = fa12Parameter.value.value;
				} else if (isDefined(bakingParameter) && isDefined(bakingParameter.value.quantity)) {
					console.log('baking');
					contractAddress = target.address;
					const tokenOrTezAmount =
						isDefined(parameter) && isDefined((parameter as ParameterFa12).value.value)
							? (parameter as ParameterFa12).value.value
							: amount.toString();
					amount =
						isDefined(parameter) && isDefined((parameter as ParameterLiquidityBaking).value.quantity)
							? (parameter as ParameterLiquidityBaking).value.quantity
							: target.address === address ||
								(isDefined(parameter) && (parameter as ParameterFa12).value.to === address)
							? tokenOrTezAmount
							: `-${tokenOrTezAmount}`;
				}
				if (
					!isDefined(operation.parameter) &&
					operation.target.address !== address &&
					operation.sender.address !== address
				) {
					continue;
				}
				break;

			case 'delegation':
				if (address !== source.address) {
					continue;
				}
				isDefined(newDelegate) && (destination = newDelegate);
				break;

			case 'origination':
				isDefined(originatedContract) && (destination = originatedContract);
				isDefined(contractBalance) && (amount = contractBalance.toString());
				break;

			default:
				continue;
		}

		activities.push({
			...(isDefined(tokenId) ? { tokenId } : {}),
			...(isDefined(contractAddress) ? { address: contractAddress } : {}),
			id,
			type,
			hash,
			status: stringToActivityStatus(status),
			source,
			entrypoint,
			level,
			destination,
			amount: source.address === address ? `-${amount}` : amount,
			timestamp: new Date(timestamp).getTime()
		});
	}

	return activities;
};



////

const isDefined = <T>(
	value: T | undefined | null
) : value is T =>
	// value != null;
	value !== undefined && value !== null;

export const stringToActivityStatus = (status: string) : ActivityStatus => {
	if(
		['applied', 'backtracked', 'skipped', 'failed'].includes(status)
	) return status as ActivityStatus;

	return 'pending';
};
