import axios from 'axios';

import { TempleTezosChainId } from 'lib/temple/types';

const networksPriority = ['mainnet', 'ghostnet'];

// 'parisnet' option is available too but it is dropped to decrease maintenance cost
type DipdupSearchNetwork = 'mainnet' | 'ghostnet';

export const dipdupNetworksChainIds: Record<DipdupSearchNetwork, string> = {
  mainnet: TempleTezosChainId.Mainnet,
  ghostnet: TempleTezosChainId.Ghostnet
};

interface TezosAccountItem {
  type: 'account';
  body: {
    Address: string;
    IsContract: boolean;
    Network: DipdupSearchNetwork;
  };
}

interface TezosAccountSearchResponse {
  total: number;
  items: TezosAccountItem[];
}

export const searchForTezosAccount = async (address: string) => {
  const { data } = await axios.post<TezosAccountSearchResponse>('https://search.dipdup.net/v1/search', {
    query: address,
    size: 10,
    offset: 0,
    disable_highlight: true,
    filters: {
      search: {
        tags: [],
        creators: [],
        minters: [],
        mime_types: [],
        network: ['mainnet', 'ghostnet'],
        index: ['accounts']
      }
    }
  });

  return {
    ...data,
    items: data.items
      .filter(item => item.body.Address === address)
      .sort((a, b) => networksPriority.indexOf(a.body.Network) - networksPriority.indexOf(b.body.Network))
  };
};
