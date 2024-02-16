import * as Migrator from 'lib/migrator';
import type { IMigration, IAppliedMigration } from 'lib/migrator';

const STORAGE_KEY = 'MIGRATIONS';

export const migrate = async (migrations: IMigration[]) => {
  const appliedMigrations = getAppliedMigrations();

  const appliedMigrationsThisTime = await Migrator.migrate(migrations, appliedMigrations);

  storeAppliedMigrations(appliedMigrations.concat(appliedMigrationsThisTime));
};

const getAppliedMigrations = () => {
  const value = localStorage.getItem(STORAGE_KEY);
  const parsedValue: IAppliedMigration[] = value
    ? JSON.parse(value, (key, val) => (key === 'dateApplied' ? new Date(val) : val))
    : [];

  return parsedValue;
};

const storeAppliedMigrations = (appliedMigrations: IAppliedMigration[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedMigrations));
};
