import axios from 'axios';
import { siteConfig } from '@/config/site';

const publicApiClient = axios.create({
  baseURL: siteConfig.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default publicApiClient;

