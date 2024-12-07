import { PageModalProps } from 'app/atoms/PageModal';
import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';

// export const EXOLIX_CONTACT_LINK = 'https://exolix.com/contact';

export const EXOLIX_TERMS_LINK = 'https://exolix.com/terms';
export const EXOLIX_PRIVICY_LINK = 'https://exolix.com/privacy';

export const INITIAL_INPUT_CURRENCY: StoredExolixCurrency = {
  code: 'ETH',
  name: 'Ethereum',
  icon: 'https://exolix.com/icons/coins/ETH.png',
  network: {
    code: 'ETH',
    fullName: 'Ethereum',
    shortName: null
  }
};

export const INITIAL_OUTPUT_CURRENCY: StoredExolixCurrency = {
  code: 'XTZ',
  name: 'Tezos',
  icon: 'https://exolix.com/icons/coins/XTZ.png',
  network: {
    code: 'XTZ',
    fullName: 'Tezos',
    shortName: null
  }
};

export type ModalState = Pick<PageModalProps, 'title' | 'shouldShowBackButton' | 'onGoBack'>;

export const defaultModalState: ModalState = {
  title: 'Crypto Exchange',
  shouldShowBackButton: undefined,
  onGoBack: undefined
};
