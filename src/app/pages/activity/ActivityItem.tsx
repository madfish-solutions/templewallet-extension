/* eslint-disable prettier/prettier */
/* eslint-disable import/order */


import React, {
	useEffect,
	useRef,
	useState,
	useMemo,
	memo,
} from 'react';

import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import FormSecondaryButton from 'app/atoms/FormSecondaryButton';
import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import MoneyDiffView from 'app/templates/activity/MoneyDiffView';
import HashChip from 'app/templates/HashChip';
import { t, getDateFnsLocale } from 'lib/i18n/react';
import { useExplorerBaseUrls } from 'lib/temple/front';
import { OpStackItem, OpStackItemType, parseMoneyDiffs, parseMoneyDiffsOfActivity, parseOpStack, parseOperStackOfActivity } from 'lib/temple/activity';
import OperStackComp from 'app/templates/activity/OperStack';


import type {
	Activity,
} from './utils';




type ActivityItemCompProps = {
	activity : Activity;
	address : string;
	syncSupported : boolean;
};

// React.memo<ActivityItemCompProps>();

const ActivityItemComp = memo<ActivityItemCompProps>(({
	activity,
	address,
	syncSupported,
}) => {
	const { hash, addedAt, status } = activity;
	//
	const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
	const pending = false;
	//
	const operStack = useMemo(() => parseOperStackOfActivity(activity, address), [activity, address]);
	//
	const moneyDiffs = useMemo(
		() => (!status || ['pending', 'applied'].includes(status) ? parseMoneyDiffsOfActivity(activity, address) : []),
		[status, activity, address]
	 );
	//
	return (
		<div className={classNames('my-3')}>
			<div className="w-full flex items-center">
				<HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />

				{ explorerBaseUrl &&
					<OpenInExplorerChip baseUrl={explorerBaseUrl} hash={hash} className="mr-2" />
				}

				<div className={classNames('flex-1', 'h-px', 'bg-gray-200')} />
			</div>

			<div className="flex items-stretch">
				<div className="flex flex-col pt-2">
					<OperStackComp opStack={operStack} className="mb-2" />

					<ActivityItemStatusComp activity={activity} syncSupported={syncSupported} />

					<Time
						children={() => (
							<span className="text-xs font-light text-gray-500">
								{ formatDistanceToNow(new Date(addedAt), {
									includeSeconds: true,
									addSuffix: true,
									locale: getDateFnsLocale()
								}) }
							</span>
						)}
					/>
				</div>

				<div className="flex-1" />

				<div className="flex flex-col flex-shrink-0 pt-2">
					{ moneyDiffs.map(({ assetId, diff }, i) => (
						<MoneyDiffView key={i} assetId={assetId} diff={diff} pending={pending} />
					))}
				</div>
			</div>
		</div>
	);
});

export default ActivityItemComp;

type ActivityItemStatusCompProps = {
	activity : Activity;
	syncSupported : boolean;
};

const ActivityItemStatusComp : React.FC<ActivityItemStatusCompProps> = ({
	activity,
	syncSupported,
}) => {
	if(syncSupported === false) return null;

	const explorerStatus = activity.status;
	const content = explorerStatus ?? 'pending';
	const conditionalTextColor = explorerStatus ? 'text-red-600' : 'text-yellow-600';

	return (
		<div className="mb-px text-xs font-light leading-none">
			<span className={classNames(explorerStatus === 'applied' ? 'text-gray-600' : conditionalTextColor, 'capitalize')}>
				{ t(content) || content }
			</span>
		</div>
	);
};

type TimeProps = {
	children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
	const [value, setValue] = useState(children);

	useEffect(() => {
	const interval = setInterval(() => {
		setValue(children());
	}, 5_000);

	return () => {
		clearInterval(interval);
	};
	}, [setValue, children]);

	return value;
};