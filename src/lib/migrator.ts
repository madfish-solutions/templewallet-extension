export interface IMigration {
  name: string;
  up: () => void;
}

export interface IAppliedMigration {
  name: string;
  dateApplied: Date;
}

export const migrate = (migrations: IMigration[], appliedMigrations: IAppliedMigration[]) => {
  const migrationsToRun = migrations.filter(({ name }) => appliedMigrations.findIndex(m => m.name === name) === -1);

  const appliedMigrationsThisTime: IAppliedMigration[] = [];

  for (const migration of migrationsToRun) {
    migration.up();
    appliedMigrationsThisTime.push({
      name: migration.name,
      dateApplied: new Date()
    });
  }

  return appliedMigrationsThisTime;
};
