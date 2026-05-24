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
  // timeout: 30000, // 30 seconds timeout
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// Request interceptor - Add auth token if available
// api.interceptors.request.use(
//   (config) => {
//     try {
//       const authStore = useAuthStore();
//       if (authStore.token) {
//         config.headers.Authorization = `Bearer ${authStore.token}`;
//       }
//     } catch (error) {
//       // Auth store might not be initialized yet, ignore
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

// // Response interceptor - Handle errors and token refresh
// api.interceptors.response.use(
//   (response) => response,
//   (error: AxiosError) => {
//     // Handle 401 Unauthorized
//     if (error.response?.status === 401) {
//       try {
//         const authStore = useAuthStore();
//         authStore.clearAuth();
//       } catch (e) {
//         // Ignore if auth store not available
//       }
//     }

//     // Log API errors in development
//     if (process.env.NODE_ENV === 'development') {
//       console.error('API Error:', {
//         status: error.response?.status,
//         message: error.message,
//         url: error.config?.url,
//         data: error.response?.data,
//       });
//     }

//     return Promise.reject(error);
//   },
// );

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
