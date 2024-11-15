import axios from 'axios';

/** This interface is not complete but sufficient for our purposes */
interface ChainlistNetworkEntry {
  rpc: { url: string }[];
  chainId: number;
}

const api = axios.create({ baseURL: 'https://chainlist.org' });

export const getEvmNetworks = async () => {
  const { data } = await api.get<ChainlistNetworkEntry[]>('/rpcs.json');

  return data;
};
