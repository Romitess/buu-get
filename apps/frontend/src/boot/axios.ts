import { boot } from 'quasar/wrappers';
import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { PLATFORM_GATEWAY } from 'src/constants/api';
import { resolveSafeInAppRedirect } from 'src/utils/safe-redirect';

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
    'API_BASE_URL is not defined. Set it in .env at the monorepo root (buu-get/.env), not apps/frontend/.env.',
  );
}

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData (let browser set it automatically with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error: Error) => Promise.reject(error),
);

export default boot(({ app, router }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  let unauthorizedInFlight: Promise<void> | null = null;

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const requestUrl = error.config?.url ?? '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (status === 401 && !isAuthEndpoint) {
        if (!unauthorizedInFlight) {
          unauthorizedInFlight = (async () => {
            const { useUserStore } = await import('src/stores/user.store');
            useUserStore().logout();
            const currentPath = router.currentRoute.value.fullPath;
            const safeRedirect = resolveSafeInAppRedirect(currentPath);
            await router.replace({
              name: 'login',
              query: safeRedirect ? { redirect: safeRedirect } : {},
            });
          })().finally(() => {
            unauthorizedInFlight = null;
          });
        }
        await unauthorizedInFlight;
      }

      return Promise.reject(error);
    },
  );
});

export { api };
