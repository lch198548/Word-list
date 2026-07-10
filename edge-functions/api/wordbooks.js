import { getStore } from "@edgeone/pages-blob";

export const onRequest = async (context) => {
  const request = context.request;
  const store = getStore("dictation-store");

  // GET /api/wordbooks
  if (request.method === 'GET') {
    try {
      const books = await store.get("wordbooks", { type: "json", consistency: "strong" }) || [];
      return new Response(JSON.stringify(books), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || '获取单词本失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // POST /api/wordbooks
  if (request.method === 'POST') {
    try {
      const books = await request.json();
      await store.setJSON("wordbooks", books);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || '更新单词本失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
};
