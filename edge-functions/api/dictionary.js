/**
 * 词典代理（EdgeOne 部署兼容版）：多源归一化音标。
 * 主源 dictionaryapi.dev（海外/能通时最准），国内兜底用有道 jsonapi（免 key、境内可达）。
 * 统一输出 { word, phonetic(美), phoneticUK(英), pos }，前端 fetchPhonetics 直接消费。
 */
export const onRequest = async (context) => {
  const request = context.request;
  const url = new URL(request.url);
  const word = (url.searchParams.get('word') || '').trim();
  const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const empty = { word, phonetic: null, phoneticUK: null, pos: null };
  if (!word) return new Response(JSON.stringify(empty), { status: 200, headers: cors });

  const result = { ...empty };

  // 第一源：dictionaryapi.dev
  try {
    const api = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const r = await fetch(api, { headers: { Accept: 'application/json' } });
    const data = await r.json();
    if (Array.isArray(data) && data.length) {
      const w = data[0];
      const strip = (s) => (typeof s === 'string' ? s.replace(/^\/|\/$/g, '').trim() : '');
      let phonetic = w.phonetic ? strip(w.phonetic) : null;
      if (Array.isArray(w.phonetics)) {
        const us = w.phonetics.find((p) => p.audio && p.audio.includes('-us') && p.text);
        const uk = w.phonetics.find((p) => p.audio && p.audio.includes('-uk') && p.text);
        const any = w.phonetics.find((p) => p.text);
        if (us && us.text) phonetic = strip(us.text);
        else if (!phonetic && any && any.text) phonetic = strip(any.text);
        if (uk && uk.text) result.phoneticUK = strip(uk.text);
      }
      if (Array.isArray(w.meanings) && w.meanings[0] && w.meanings[0].partOfSpeech) {
        const m = { noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.', pronoun: 'pron.', preposition: 'prep.', conjunction: 'conj.', interjection: 'int.', auxiliary: 'aux.', article: 'art.' };
        result.pos = m[w.meanings[0].partOfSpeech] || w.meanings[0].partOfSpeech;
      }
      if (phonetic) result.phonetic = phonetic;
    }
  } catch {}

  // 国内兜底：有道 jsonapi（免 key、境内可达，含美/英音标与词性）
  if (!result.phonetic && !result.phoneticUK && !result.pos) {
    try {
      const api = `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`;
      const r = await fetch(api, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
      const data = await r.json();
      const ew =
        (data && data.ec && data.ec.word && data.ec.word[0]) ||
        (data && data.webster && data.webster.ec && data.webster.ec.word && data.webster.ec.word[0]) ||
        null;
      if (ew) {
        if (ew.usphone) result.phonetic = ew.usphone;
        if (ew.ukphone) result.phoneticUK = ew.ukphone;
        const firstTr =
          ew.trs && ew.trs[0] && ew.trs[0].tr && ew.trs[0].tr[0] && ew.trs[0].tr[0].l && ew.trs[0].tr[0].l.i && ew.trs[0].tr[0].l.i[0];
        if (typeof firstTr === 'string') {
          const mm = firstTr.match(/^(n|v|adj|adv|prep|conj|pron|int|aux|art)\./i);
          if (mm) result.pos = mm[1].toLowerCase() + '.';
        }
      }
    } catch {}
  }

  return new Response(JSON.stringify(result), { status: 200, headers: cors });
};
