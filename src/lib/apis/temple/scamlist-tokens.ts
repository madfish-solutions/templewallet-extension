import axios from 'axios';

interface ScamlistResponse {
  name: string;
  version: string;
  slugs: Record<string, boolean>;
}

const scamlistApi = axios.create({
  baseURL: 'https://raw.githubusercontent.com/madfish-solutions/tokens-scamlist/master/'
});

export const fetchScamlistTokens = () =>
  scamlistApi.get<ScamlistResponse>('tokens/scamlist.json').then(
    ({ data }) => data.slugs ?? {},
    error => {
      console.error(error);
      throw error;
    }
  );
