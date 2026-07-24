export async function onRequest(context) {
  const { request } = context;
  
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const lan = url.searchParams.get('lan') || 'en';
  const text = url.searchParams.get('text');
  const spd = url.searchParams.get('spd') || '3';

  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const ttsUrl = `https://fanyi.baidu.com/gettts?lan=${lan}&text=${text}&spd=${spd}&source=web`;
    const response = await fetch(ttsUrl);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch TTS' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}