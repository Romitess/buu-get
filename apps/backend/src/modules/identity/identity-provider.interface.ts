/**
 * Thin identity port for a future ThaiD (or other IdP) OIDC integration.
 * Not wired to login UI; does not flip userThaidSynced.
 * Separate from payment webhook stubs at `/approval` and `/payment`.
 */

export interface IdentityAuthStartOptions {
  /** Optional return path after successful callback (relative app route). */
  returnTo?: string;
}

export interface IdentityAuthStartResult {
  /** Authorization URL when IdP is configured; null when stubbed. */
  authorizationUrl: string | null;
  state: string | null;
}

export interface IdentityCallbackPayload {
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}

export interface IdentityCallbackResult {
  subject: string | null;
  claims: Record<string, unknown>;
}

export interface IdentityProvider {
  startAuth(
    options?: IdentityAuthStartOptions,
  ): Promise<IdentityAuthStartResult>;
  handleCallback(
    payload: IdentityCallbackPayload,
  ): Promise<IdentityCallbackResult>;
  linkToUser(userId: number, identitySubject: string): Promise<void>;
}
