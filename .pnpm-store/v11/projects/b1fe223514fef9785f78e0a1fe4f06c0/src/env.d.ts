declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    API_BASE_URL: string | undefined;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}
