export interface ManageAssetsCommonProps {
  chainId: string;
  publicKeyHash: string;
  removeItem: (slug: string) => void;
  toggleTokenStatus: (slug: string, toDisable: boolean) => void;
}
