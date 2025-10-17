import React, { FC } from 'react';

import clsx from 'clsx';

export interface TableRow {
  key: string | number;
  className?: string;
  cells: { children: ReactChildren; className?: string }[];
}

interface ScrollableTableProps {
  className?: string;
  columns: ReactChildren[];
  rows: TableRow[];
}

export const ScrollableTable: FC<ScrollableTableProps> = ({ className, columns, rows }) => (
  <div className={clsx(className, 'overflow-auto')}>
    <table className="!border-separate border-spacing-x-2">
      <thead className="sticky top-0 -mx-2">
        <tr>
          {columns.map((column, index) => (
            <th key={index} className={clsx(index === 0 ? 'text-left' : 'text-right', 'bg-background')}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="-mx-2">
        {rows.map(({ key, className, cells }) => (
          <tr key={key} className={className}>
            {cells.map((cell, index) => (
              <td key={index} className={clsx(index === 0 ? 'text-left' : 'text-right', cell.className)}>
                {cell.children}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
