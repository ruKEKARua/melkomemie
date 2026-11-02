export type GoogleSession = {
  refreshToken: string;
  userName: string;
  userPicture: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

export const sessionCookieName = '__Host-movie-session';
export const stateCookieName = '__Host-movie-oauth-state';
export const sessionTtlSeconds = 30 * 24 * 60 * 60;

export const getCookie = (request: Request, name: string) =>
  request.headers
    .get('Cookie')
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);

export const getSessionCookie = (request: Request) =>
  getCookie(request, sessionCookieName) ?? getCookie(request, 'movie-session');

export const getStateCookie = (request: Request) =>
  getCookie(request, stateCookieName) ?? getCookie(request, 'movie-oauth-state');

export const createCookie = (name: string, value: string, maxAge: number, request?: Request) => {
  const isHttps = request ? request.url.startsWith('https:') : true;
  const cookieName = !isHttps && name.startsWith('__Host-') ? name.replace('__Host-', '') : name;
  const secureFlag = isHttps ? 'Secure;' : '';
  return `${cookieName}=${value}; Max-Age=${maxAge}; Path=/; ${secureFlag} HttpOnly; SameSite=Lax`;
};

export const expiredCookie = (name: string, request?: Request) => {
  const isHttps = request ? request.url.startsWith('https:') : true;
  const cookieName = !isHttps && name.startsWith('__Host-') ? name.replace('__Host-', '') : name;
  const secureFlag = isHttps ? 'Secure;' : '';
  return `${cookieName}=; Max-Age=0; Path=/; ${secureFlag} HttpOnly; SameSite=Lax`;
};

export const createRandomValue = (byteLength = 32) => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const redirectWithAuthError = (request: Request, reason = 'google_oauth') => {
  const errorUrl = new URL('/', request.url);
  errorUrl.searchParams.set('auth_error', reason);
  return Response.redirect(errorUrl, 302);
};

export const getOAuthConfig = () => {
  let clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  // If secret is JSON from Google Cloud Console credentials download
  if (clientSecret && clientSecret.startsWith('{')) {
    try {
      const parsed = JSON.parse(clientSecret);
      clientSecret = parsed.web?.client_secret || parsed.installed?.client_secret || parsed.client_secret || clientSecret;
      if (!clientId) {
        clientId = parsed.web?.client_id || parsed.installed?.client_id || parsed.client_id;
      }
    } catch {
      // ignore
    }
  }

  if (clientId && clientId.startsWith('{')) {
    try {
      const parsed = JSON.parse(clientId);
      clientId = parsed.web?.client_id || parsed.installed?.client_id || parsed.client_id || clientId;
    } catch {
      // ignore
    }
  }

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured');
  }

  return {
    clientId,
    clientSecret,
  };
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function sealSession(session: GoogleSession, secret: string): Promise<string> {
  const key = await getEncryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(session));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new Uint8Array(data));

  const ivBase64 = toBase64Url(iv);
  const ctBase64 = toBase64Url(new Uint8Array(ciphertext));
  return `${ivBase64}.${ctBase64}`;
}

export async function unsealSession(token: string, secret: string): Promise<GoogleSession | null> {
  try {
    const [ivBase64, ctBase64] = token.split('.');
    if (!ivBase64 || !ctBase64) return null;
    const iv = fromBase64Url(ivBase64);
    const ciphertext = fromBase64Url(ctBase64);
    const key = await getEncryptionKey(secret);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(ciphertext));
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted)) as GoogleSession;
  } catch {
    return null;
  }
}

export async function requestGoogleToken(parameters: Record<string, string>) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parameters),
  });
  const token = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !token.access_token) {
    throw new Error(token.error ?? 'Google token request failed');
  }

  return token;
}

export async function getGoogleUser(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Google user information request failed');
  }

  return (await response.json()) as { name?: string; email?: string; picture?: string };
}

export async function getStoredSession(request: Request) {
  const sessionId = getSessionCookie(request);
  if (!sessionId) {
    return null;
  }

  try {
    const { clientSecret } = getOAuthConfig();
    const session = await unsealSession(sessionId, clientSecret);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      session,
    };
  } catch {
    return null;
  }
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getOAuthConfig();
  const token = await requestGoogleToken({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  return token.access_token as string;
}

export function jsonResponse(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}
