import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
  },
});

const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG;
if (tenantSlug) {
  api.defaults.headers.common['x-tenant'] = tenantSlug;
}
