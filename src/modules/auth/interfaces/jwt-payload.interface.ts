export interface JwtPayload {
  iss: string; // Issuer
  aud: string[]; // Audience
  sub: string; // Subject (user ID)
  client_id: string; // OAuth2 client ID
  user_id: string; // User ID
  scopes: string[]; // Granted scopes
  type: 'access_token' | 'refresh_token'; // Token type
  exp: number; // Expiration time (Unix timestamp)
  iat: number; // Issued at time (Unix timestamp)
  nbf?: number; // Not before (Unix timestamp)
  jti?: string; // JWT ID
}

export interface IntrospectionResponse {
  active: boolean;
  client_id?: string;
  username?: string;
  scope?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string[];
  iss?: string;
}

export interface AuthenticatedUser {
  id: string;
  sub: string;
  clientId: string;
  scopes: string[];
  exp: number;
}
