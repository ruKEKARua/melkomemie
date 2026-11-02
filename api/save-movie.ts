import {
  createCookie,
  expiredCookie,
  getStoredSession,
  jsonResponse,
  refreshGoogleAccessToken,
  sessionCookieName,
  sessionTtlSeconds,
} from './_shared/auth';
import { appendMovieToSheet, type MovieSheetEntry } from '../src/api/googleSheets';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ error: 'invalid_origin' }, 403);
  }

  const stored = await getStoredSession(request);
  if (!stored) {
    return jsonResponse({ error: 'not_authenticated' }, 401, {
      'Set-Cookie': expiredCookie(sessionCookieName, request),
    });
  }

  let entry: MovieSheetEntry;
  try {
    const body = (await request.json()) as MovieSheetEntry;
    if (
      typeof body.date !== 'string' ||
      typeof body.title !== 'string' ||
      !Array.isArray(body.participants) ||
      body.participants.some(
        (participant) =>
          typeof participant?.name !== 'string' || typeof participant.score !== 'string',
      )
    ) {
      return jsonResponse({ error: 'invalid_entry' }, 400);
    }
    entry = body;
  } catch {
    return jsonResponse({ error: 'invalid_entry' }, 400);
  }

  try {
    const accessToken = await refreshGoogleAccessToken(stored.session.refreshToken);
    await appendMovieToSheet(accessToken, entry);

    return jsonResponse({ ok: true }, 200, {
      'Set-Cookie': createCookie(sessionCookieName, stored.sessionId, sessionTtlSeconds, request),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return jsonResponse({ error: 'session_expired' }, 401, {
        'Set-Cookie': expiredCookie(sessionCookieName, request),
      });
    }

    console.error('Не удалось сохранить фильм в Google Sheets:', error);
    return jsonResponse({ error: 'save_failed' }, 502);
  }
}

export { handler as POST };
