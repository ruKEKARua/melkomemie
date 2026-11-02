import {
  createCookie,
  expiredCookie,
  getGoogleUser,
  getOAuthConfig,
  getStateCookie,
  redirectWithAuthError,
  requestGoogleToken,
  sealSession,
  sessionCookieName,
  sessionTtlSeconds,
  stateCookieName,
} from '../_shared/auth';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const expectedState = getStateCookie(request);
  const code = url.searchParams.get('code');

  if (url.searchParams.has('error')) {
    const response = redirectWithAuthError(request, url.searchParams.get('error') ?? 'google_oauth');
    response.headers.append('Set-Cookie', expiredCookie(stateCookieName, request));
    return response;
  }

  if (!state || !expectedState || state !== expectedState || !code) {
    const response = redirectWithAuthError(request, 'invalid_state');
    response.headers.append('Set-Cookie', expiredCookie(stateCookieName, request));
    return response;
  }

  try {
    const { clientId, clientSecret } = getOAuthConfig();
    const callbackUrl = new URL('/api/auth/callback', request.url).toString();
    const token = await requestGoogleToken({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    });

    if (!token.refresh_token) {
      throw new Error('Google did not return a refresh token');
    }

    const user = await getGoogleUser(token.access_token as string);
    const sessionToken = await sealSession(
      {
        refreshToken: token.refresh_token,
        userName: user.name ?? user.email ?? 'Пользователь Google',
        userPicture: user.picture ?? '',
      },
      clientSecret,
    );

    const headers = new Headers({
      Location: new URL('/', request.url).toString(),
      'Cache-Control': 'no-store',
    });
    headers.append('Set-Cookie', expiredCookie(stateCookieName, request));
    headers.append('Set-Cookie', createCookie(sessionCookieName, sessionToken, sessionTtlSeconds, request));

    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error('Error exchanging Google OAuth code:', error);
    const reason =
      error instanceof Error && error.message === 'Google OAuth is not configured'
        ? 'oauth_not_configured'
        : error instanceof Error && error.message.includes('Google did not return a refresh token')
        ? 'no_refresh_token'
        : 'token_exchange_failed';
    const response = redirectWithAuthError(request, reason);
    response.headers.append('Set-Cookie', expiredCookie(stateCookieName, request));
    return response;
  }
}

export { handler as GET };
