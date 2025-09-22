import { withUnlocked } from './store';

export function provePossession(sourcePkh: string) {
  return withUnlocked(async ({ vault }) => {
    return await vault.provePossession(sourcePkh);
  });
}
