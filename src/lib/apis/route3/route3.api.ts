import axios from 'axios';

export const route3Api = axios.create({
  baseURL: 'https://temple.3route.io',
  headers: {
    Authorization: 'Basic VGVtcGxlOhYiv1MjvqtIV9tvGYNKa+oZ6enk808L3aOAL9qYSl05'
  }
});
