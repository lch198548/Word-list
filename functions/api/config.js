import { getStore } from "@edgeone/pages-blob";

const defaultConfig = {
  password: '123',
  baiduAppId: '20240607002071839',
  baiduKey: 'EER6yOohPC_NtHszZs2G',
  exportDelimiter: '        ',
  dictationSettings: {
    mode: 'chinese',
    repeatCount: 2,
    interval: 3,
    speed: 'medium',
    type: 'online'
  }
};

export const onRequest = async (context) => {
  const request = context.request;
  const store = getStore("dictation-store");

  // GET /api/config
  if (request.method === 'GET') {
    try {
      let configData = await store.get("config", { type: "json", consistency: "strong" });
      if (!configData) {
        configData = defaultConfig;
        await store.setJSON("config", configData);
      }
      
      // Strip password for client
      const { password, ...safeConfig } = configData;
      return new Response(JSON.stringify(safeConfig), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || '获取配置失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // POST /api/config
  if (request.method === 'POST') {
    try {
      const updates = await request.json();
      let configData = await store.get("config", { type: "json", consistency: "strong" }) || defaultConfig;

      const updatedConfig = {
        ...configData,
        ...updates,
        dictationSettings: updates.dictationSettings 
          ? { ...configData.dictationSettings, ...updates.dictationSettings }
          : configData.dictationSettings
      };

      // Ensure password is not overwritten
      if (configData.password) {
        updatedConfig.password = configData.password;
      }

      await store.setJSON("config", updatedConfig);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || '更新配置失败' }), {
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
