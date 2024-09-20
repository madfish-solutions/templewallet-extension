export interface SendFormData {
  amount: string;
  to: string;
}

export interface ConfirmData extends SendFormData {
  fee: string;
  storageLimit?: string;
}
