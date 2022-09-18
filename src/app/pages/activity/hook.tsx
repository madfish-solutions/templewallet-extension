/* eslint-disable prettier/prettier */
/* eslint-disable import/order */

import React, {
	useEffect,
	useRef,
	useState,
	useMemo,
} from 'react';
import {
	useSafeState,
} from 'ahooks';

import {
	useDidMount,
	useDidUpdate,
} from 'rooks';

import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import { useExplorerBaseUrls, useTezos } from 'lib/temple/front';
import {
	useChainId,
	useAccount,
} from 'lib/temple/front';
import { isKnownChainId } from 'lib/tzkt/api';

import fetchActivities from './fetching';

import {
	Activity,
} from './utils';


////

type TLoading = 'init' | 'more' | false;

export default function useLatestActivitiesOfCurrentAccount(
	initialPseudoLimit : number,
   assetSlug ? : string,
) {
	const tezos = useTezos();
	const chainId = useChainId(true);
	const account = useAccount();
	//
	const currentAccountAddress = account.publicKeyHash;
	//
	const [loading, setLoading] = useSafeState<TLoading>( isKnownChainId(chainId) && 'init' );
	const [activities, setActivities] = useSafeState<Activity[]>([]);
	const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);
	const [syncing, setSyncing] = useSafeState(false);
	// const [loadingError, setLoadingError] = useState<Error | null>(null);
	//
	async function first_loadLatestActivities() {
		if(!isKnownChainId(chainId)) return;
		//
		let newActivities : Activity[];
		try {
			newActivities = await fetchActivities(
				chainId,
				account,
				assetSlug,
				initialPseudoLimit,
				tezos,
			);
		}
		catch(error) {
			setLoading(false);
			console.log(error);

			// first_loadLatestActivities();

			return;
		}
		//
		setActivities(newActivities);
		setLoading(false);
		// if(newActivities.length < initialLimit)
		if(newActivities.length === 0) setReachedTheEnd(true);
		console.log(newActivities);
	}

	// const syncTimeoutRef = useRef<NodeJS.Timeout>();
	// const syncIntervalRef = useRef<NodeJS.Timeout>();

	/** Loads more of older items */
	async function loadMore(pseudoMoreN : number) {
		if(loading) return;
		if(!isKnownChainId(chainId)) return;
		//
		//
		setLoading('more');
		const lastActivity = activities[activities.length - 1];
		//
		let newActivities : Activity[];
		try {
			newActivities = await fetchActivities(
				chainId,
				account,
				assetSlug,
				pseudoMoreN,
				tezos,
				lastActivity,
			);
		}
		catch(error) {
			setLoading(false);
			console.log(error);
			//
			return;
		}
		//
		setActivities( activities.concat(newActivities) );
		setLoading(false);
		// if(newActivities.length < moreN)
		if(newActivities.length === 0) setReachedTheEnd(true);
		console.log(newActivities);
		//
		// syncTimeoutRef.current = setTimeout(() => {
		// 	setSyncing(true);
		// 	//
		// }, 10_000);
	}
	//
	useDidMount(() => {
		if(initialPseudoLimit < 1) return;
		//
		first_loadLatestActivities();
		//
		// syncIntervalRef.current = setInterval(async () => {
		// 	if(syncing || loading === 'init') return;
		// 	if(!isKnownChainId(chainId)) return;
		// 	//
		// 	setSyncing(true);
		// 	//
		// 	let data : TzktOperation[];
		// 	try {
		// 		const newerThan = activities[0]?.addedAt;
		// 		data = await fetchGetOperations(
		// 			chainId,
		// 			currentAccountAddress,
		// 			{
		// 				type: ['delegation', 'origination', 'transaction'],
		// 				...( newerThan ? { 'timestamp.gt': newerThan } : {} ),
		// 				sort: 1,
		// 			},
		// 		);
		// 	}
		// 	catch(error) {
		// 		setSyncing(false);
		// 		console.error(error);
		// 		//
		// 		return;
		// 	}
		// 	//
		// 	const newActivities = data.map(o => ({
		// 		hash: o.hash,
		// 		addedAt: o.timestamp,
		// 	}));
		// 	//
		// 	setActivities( newActivities.concat(activities) );
		// 	setSyncing(false);
		// }, 10_000);
		//
		return () => {
			// if(syncIntervalRef.current != null) {
			// 	clearInterval(syncIntervalRef.current);
			// 	syncIntervalRef.current = undefined;
			// 	//
			// 	//
			// }
		};
	});

	/*
	useDidUpdate(() => {
		setActivities([]);
		setLoading( isKnownChainId(chainId) && 'init' );
		setReachedTheEnd(false);

		if(initialPseudoLimit < 1) return;

		first_loadLatestActivities();
	}, [chainId, currentAccountAddress, assetSlug]);
	*/

	return {
		loading,
		syncing, // polling for new fresh items
		reachedTheEnd,
		list: activities,
		loadMore,
	};
}


////
