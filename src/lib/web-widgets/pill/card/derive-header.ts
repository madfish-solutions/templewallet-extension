import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';

// objkt's shared open-edition factory: thousands of unrelated tokens from different
// artists all report fa.name = "open objkt", so it is not a meaningful collection.
// For these, objkt.com shows the creator/artist instead
const OPEN_EDITION_FACTORY_CONTRACTS = new Set(['KT1XaCf6gkjFnKg3QmPfn6gep53moMvjkj1E']);

const isOpenEditionFactory = (contract: string, faName?: string | null): boolean =>
  OPEN_EDITION_FACTORY_CONTRACTS.has(contract) || (faName ?? '').trim().toLowerCase() === 'open objkt';

const shortenAddress = (address: string): string =>
  address.length > 12 ? `${address.slice(0, 5)}…${address.slice(-4)}` : address;

interface CardHeaderData {
  name: string | null;
  href?: string;
}

export const deriveHeader = (token: ObjktToken | null, contract: string): CardHeaderData => {
  const fa = token?.fa ?? null;

  if (contract && fa && !isOpenEditionFactory(contract, fa.name)) {
    return { name: fa.name ?? null, href: `https://objkt.com/collections/${contract}` };
  }

  const creator = token?.creators?.[0]?.holder ?? null;
  if (creator?.address) {
    return {
      name: creator.alias?.trim() || shortenAddress(creator.address),
      href: `https://objkt.com/users/${creator.address}`
    };
  }

  return {
    name: fa?.name ?? null,
    href: contract ? `https://objkt.com/collections/${contract}` : undefined
  };
};
