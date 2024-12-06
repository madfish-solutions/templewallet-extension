import React, { FC, useMemo } from 'react';

import { formatDate } from 'lib/i18n';

interface AddedAt {
  /** ISO string */
  addedAt: string;
}

export function useGroupingByDate<T extends AddedAt>(sorted: T[]) {
  return useMemo(() => {
    const groupedItems = new Map<string, T[]>();

    for (const item of sorted) {
      const dateStr = formatDate(item.addedAt, 'PP');

      const group = groupedItems.get(dateStr) ?? [];

      if (!groupedItems.has(dateStr)) groupedItems.set(dateStr, group);

      group.push(item);
    }

    return Array.from(groupedItems);
  }, [sorted]);
}

interface ActivitiesDateGroupProps extends PropsWithChildren {
  title: string;
}

export const ActivitiesDateGroup: FC<ActivitiesDateGroupProps> = ({ title, children }) => {
  return (
    <>
      <div className="mb-1 p-1 text-font-description-bold">{title}</div>

      {children}
    </>
  );
};
