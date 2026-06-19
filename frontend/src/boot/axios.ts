import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { PLATFORM_GATEWAY } from 'src/constants/api';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const apiBaseURL =
  process.env.API_BASE_URL ?? (process.env.PROD ? PLATFORM_GATEWAY.BASE_PATH : undefined);

if (!apiBaseURL) {
  throw new Error(
    'API_BASE_URL is not defined. Set it in buu-get-front/.env (root of monorepo, not frontend/.env).',
  );
}

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
