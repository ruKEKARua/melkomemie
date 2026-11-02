import {
  expiredCookie,
  jsonResponse,
  sessionCookieName,
} from './_shared/auth';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ error: 'invalid_origin' }, 403);
  }

  return jsonResponse(
    { ok: true },
    200,
    {
      'Set-Cookie': expiredCookie(sessionCookieName, request),
    },
  );
}

export { handler as POST };
