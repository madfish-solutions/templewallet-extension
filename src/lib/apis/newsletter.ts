import axios from 'axios';

export const newsletterApi = axios.create({
  baseURL: 'https://jellyfish-app-deove.ondigitalocean.app/'
});
