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
    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return new Response(JSON.stringify({ error: '所有字段均为必填项' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const store = getStore("dictation-store");
    let configData = await store.get("config", { type: "json", consistency: "strong" }) || { password: '123' };

    if (configData.password === oldPassword) {
      configData.password = newPassword;
      await store.setJSON("config", configData);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: '旧密码输入错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || '修改密码失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
