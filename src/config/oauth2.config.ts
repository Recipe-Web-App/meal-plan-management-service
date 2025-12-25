export interface OAuth2EndpointsConfig {
  token: string;
  introspect: string;
  userinfo: string;
  revoke: string;
}

export interface OAuth2StaticConfig {
  authBaseUrl: string;
  issuer: string;
  scopes: string[];
  endpoints: OAuth2EndpointsConfig;
  tokenCacheTTL: number;
  introspectionCacheTTL: number;
  tokenRefreshBuffer: number;
}

export const oauth2Config: OAuth2StaticConfig = {
  authBaseUrl: process.env.OAUTH2_AUTH_BASE_URL ?? 'https://sous-chef-proxy.local/api/v1/auth',
  issuer: 'auth-service',
  scopes: ['read', 'write'],
  endpoints: {
    token: '/oauth2/token',
    introspect: '/oauth2/introspect',
    userinfo: '/oauth2/userinfo',
    revoke: '/oauth2/revoke',
  },
  // Cache service tokens for 55 minutes (with 5min buffer for 1hr tokens)
  tokenCacheTTL: 3300000,
  // Cache introspection results for 1 minute
  introspectionCacheTTL: 60000,
  // Refresh tokens 30 seconds before expiry
  tokenRefreshBuffer: 30000,
};
