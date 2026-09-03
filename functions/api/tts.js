/**
 * Edge TTS 高清服务端后端（Cloudflare Workers 部署兼容版，逻辑同 edge-functions/api/tts.js）
 * 免费、无需密钥、支持 en-US / en-GB / zh-CN。复刻 edge-tts 官方协议。
 */
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_BASE = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const SEC_MS_GEC_VERSION = '1-143.0.3650.75';
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

const DEFAULT_VOICES = {
  en: 'en-US-AriaNeural',
  'en-US': 'en-US-AriaNeural',
  'en-GB': 'en-GB-RyanNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
};

const RATE_MAP = { slow: '-30%', normal: '+0%', medium: '+0%', fast: '+20%' };

function uuid() {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}

function muid() {
  const b = new Uint8Array(16);
  globalThis.crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function sha256Hex(str) {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function secMsGec() {
  let ticks = Date.now() / 1000;
  ticks += 11644473600;
  ticks -= ticks % 300;
  ticks *= 1e7;
  return sha256Hex(Math.floor(ticks).toString() + TRUSTED_CLIENT_TOKEN);
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSsml(text, voice, rate) {
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
}

function toBytes(data) {
  if (typeof data === 'string') {
    const arr = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) arr[i] = data.charCodeAt(i) & 0xff;
    return arr;
  }
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data);
}

function concatBytes(list) {
  const total = list.reduce((s, b) => s + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of list) {
    out.set(b, off);
    off += b.length;
  }
  return out;
}

function findDoubleCrlf(bytes) {
  for (let i = 0; i + 3 < bytes.length; i++) {
    if (bytes[i] === 0x0d && bytes[i + 1] === 0x0a && bytes[i + 2] === 0x0d && bytes[i + 3] === 0x0a) return i;
  }
  return -1;
}

async function synthesize(text, voice, rate) {
  if (typeof WebSocket === 'undefined') throw new Error('WebSocket unsupported in this runtime');

  const token = await secMsGec();
  const url = `${WSS_BASE}&ConnectionId=${uuid()}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'Sec-WebSocket-Version': '13',
    Cookie: `muid=${muid()};`,
  };

  const ws = new WebSocket(url, { headers });
  const chunks = [];
  let resolved = false;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('Edge TTS timeout'));
    }, 15000);

    ws.onopen = () => {
      const date = new Date().toUTCString();
      const config =
        `X-Timestamp:${date}\r\n` +
        'Content-Type:application/json; charset=utf-8\r\n' +
        'Path:speech.config\r\n\r\n' +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"${OUTPUT_FORMAT}"}}}}\r\n`;
      ws.send(config);

      const ssml = buildSsml(text, voice, rate);
      const ssmlMsg =
        `X-RequestId:${uuid()}\r\n` +
        'Content-Type:application/ssml+xml\r\n' +
        `X-Timestamp:${date}Z\r\n` +
        'Path:ssml\r\n\r\n' +
        ssml;
      ws.send(ssmlMsg);
    };

    ws.onmessage = (event) => {
      const buf = toBytes(event.data);
      const idx = findDoubleCrlf(buf);
      if (idx === -1) return;
      const head = buf.subarray(0, idx).toString('latin1');
      const body = buf.subarray(idx + 4);
      if (head.includes('Path:turn.end')) return;
      if (head.includes('Path:audio') && body.length > 0) chunks.push(body);
    };

    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Edge TTS websocket error'));
    };

    ws.onclose = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(true);
    };
  });

  if (chunks.length === 0) throw new Error('Edge TTS produced no audio');
  return concatBytes(chunks);
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let params = {};
  if (request.method === 'POST') {
    try {
      params = await request.json();
    } catch {
      params = {};
    }
  } else {
    params = Object.fromEntries(new URL(request.url).searchParams.entries());
  }

  const text = (params.text || params.q || '').toString().slice(0, 1000);
  const lang = (params.lang || 'en').toString();
  const speed = (params.speed || 'normal').toString();
  const voice = params.voice || DEFAULT_VOICES[lang] || DEFAULT_VOICES.en;
  const rate = params.rate || RATE_MAP[speed] || '+0%';

  if (!text.trim()) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const mp3 = await synthesize(text, voice, rate);
    return new Response(mp3, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e && e.message ? e.message : 'TTS failed' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }
}
