import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const apiBaseURL = process.env.API_BASE_URL;
if (!apiBaseURL) {
  throw new Error(
    'API_BASE_URL is not defined. Set it in .env (see .env.example) before starting the app.',
  );
}

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
