import { getStore } from "@edgeone/pages-blob";

export const onRequest = async (context) => {
  const request = context.request;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { password } = await request.json();
    if (!password) {
      return new Response(JSON.stringify({ error: '密码不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const store = getStore("dictation-store");
    // Use strong consistency for password verification to prevent stale reads
    let configData = await store.get("config", { type: "json", consistency: "strong" });
    
    // Fallback if not configured yet
    if (!configData) {
      configData = { password: '123' };
    }

    if (configData.password === password) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
