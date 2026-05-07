import crypto from "crypto";

/** Generate PKCE code_verifier + code_challenge */
export function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

/** Generate cryptographically random state / nonce */
export function generateRandom(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Build the QF authorization URL */
export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  nonce: string;
  scopes: string;
  oauthEndpoint: string;
}) {
  const url = new URL(`${params.oauthEndpoint}/oauth2/auth`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scopes);
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
  oauthEndpoint: string;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });

  const authHeader = "Basic " + Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");

  const res = await fetch(`${params.oauthEndpoint}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authHeader,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} — ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }>;
}

/** Refresh an access token */
export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  oauthEndpoint: string;
}) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });

  const authHeader = "Basic " + Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");

  const res = await fetch(`${params.oauthEndpoint}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authHeader,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} — ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
  }>;
}
