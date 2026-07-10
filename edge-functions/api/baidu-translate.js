export const onRequest = async (context) => {
  const request = context.request;
  const url = new URL(request.url);
  const queryString = url.search;
  const baiduUrl = `https://fanyi-api.baidu.com/api/trans/vip/translate${queryString}`;

  try {
    const response = await fetch(baiduUrl);
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Content-Type', 'application/json');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Translation proxy failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
