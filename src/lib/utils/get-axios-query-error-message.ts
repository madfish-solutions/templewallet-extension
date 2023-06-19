import { isDefined } from '@rnw-community/shared';
import axios from 'axios';

export const getAxiosQueryErrorMessage = (error: unknown, fallbackErrorMessage = 'Unknown error') => {
  if (axios.isAxiosError(error)) {
    const responseDescription = isDefined(error.response) ? `with status ${error.response.status}` : 'without response';
    const { url, baseURL } = error.config;
    const fullUrl = isDefined(baseURL) ? `${baseURL}${url}` : url;

    return `Request to ${fullUrl} failed ${responseDescription}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackErrorMessage;
};
