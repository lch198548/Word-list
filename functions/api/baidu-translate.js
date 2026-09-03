/**
 * 翻译代理（Cloudflare 部署兼容版）：优先百度 VIP，失败兜底 MyMemory（免密钥）。
 * 返回结构保持 { trans_result: [{ dst }] }，前端 useDictionary 无需改动。
 */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export const onRequest = async (context) => {
  const request = context.request;
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const from = url.searchParams.get('from') || 'en';
  const to = url.searchParams.get('to') || 'zh';

  if (!q) return json({ trans_result: [{ dst: '' }] });

  try {
    const baiduUrl = `https://fanyi-api.baidu.com/api/trans/vip/translate${url.search}`;
    const r = await fetch(baiduUrl);
    const data = await r.json();
    if (
      data &&
      Array.isArray(data.trans_result) &&
      data.trans_result.length > 0 &&
      data.trans_result[0] &&
      data.trans_result[0].dst
    ) {
      return json(data);
    }
  } catch {
    /* 忽略，走兜底 */
  }

  try {
    const src = from === 'zh' ? 'zh-CN' : 'en';
    const dst = to === 'zh' ? 'zh-CN' : to === 'en' ? 'en' : to;
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      q,
    )}&langpair=${encodeURIComponent(src + '|' + dst)}`;
    const r2 = await fetch(mmUrl);
    const d2 = await r2.json();
    const text = d2 && d2.responseData && d2.responseData.translatedText;
    if (text && text.trim()) {
      return json({ trans_result: [{ dst: text.trim() }] });
    }
  } catch {
    /* 忽略 */
  }

  return json({ trans_result: [{ dst: '' }] });
};
