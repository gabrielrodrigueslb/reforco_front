import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
    'Content-Type': 'application/json',
  },
});
