export const config = {
  runtime: 'edge',
};

const IMAGE_PROXY_BASE = 'https://movies-tmdb-proxy.kekar.workers.dev/image';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  url.searchParams.delete('path');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `${IMAGE_PROXY_BASE}${cleanPath}${url.search ? `?${url.searchParams.toString()}` : ''}`;

  try {
    const response = await fetch(targetUrl);

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response(null, { status: 404 });
  }
}

export { handler as GET };
