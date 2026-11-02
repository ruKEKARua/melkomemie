export const config = {
  runtime: 'edge',
};

const TMDB_PROXY_BASE = 'https://movies-tmdb-proxy.kekar.workers.dev/tmdb';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  url.searchParams.delete('path');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `${TMDB_PROXY_BASE}${cleanPath}${url.search ? `?${url.searchParams.toString()}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Accept: 'application/json',
      },
    });

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('TMDB proxy error:', error);
    return new Response(JSON.stringify({ error: 'tmdb_proxy_failed' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export { handler as GET };
