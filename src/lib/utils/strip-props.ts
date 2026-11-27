/**
 * Removes properties whose value is `undefined`.
 * Mutates `record` and returns the same object.
 */
export const stripUndefinedProps = <T extends object>(record: T): T => {
  for (const key in record) {
    if (record[key] === undefined) delete record[key];
  }

  return record;
};

export const stripEmptyProps = <T extends object>(record: T): T => {
  for (const key in record) {
    if (record[key] === '' || record[key] === undefined) delete record[key];
  }

  return record;
};

const isMissingValue = (value: unknown) => value == null || value === '';

export const filledFields = (record: object) =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => !isMissingValue(value)));

export const countFilledFields = (record: object) =>
  Object.values(record).filter(value => !isMissingValue(value)).length;
