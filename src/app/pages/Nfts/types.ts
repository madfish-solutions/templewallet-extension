export interface CollectiblesCollection {
  chainId: string | number;
  title?: string;
  logoSrc?: string[];
  collectionSlug: string;
  /** Chain and contract, shared by every collection minted on that contract. */
  contractSlug: string;
}
