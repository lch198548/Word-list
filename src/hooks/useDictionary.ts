import { useState, useCallback } from 'react';
import { Word } from '../types';
import { useWordStore } from '../stores/wordStore';

interface DictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics?: {
    text?: string;
    audio?: string;
  }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
}

interface BaiduResponse {
  trans_result: {
    dst: string;
  }[];
  error_code?: string;
  error_msg?: string;
}

const POS_MAP: Record<string, string> = {
  noun: 'n.',
  verb: 'v.',
  adjective: 'adj.',
  adverb: 'adv.',
  pronoun: 'pron.',
  preposition: 'prep.',
  conjunction: 'conj.',
  interjection: 'int.',
  auxiliary: 'aux.',
  article: 'art.',
};

const POS_PATTERNS: Array<{ pattern: RegExp; pos: string }> = [
  { pattern: /^(the|a|an)$/i, pos: 'art.' },
  { pattern: /^(this|that|these|those|it|he|she|they|we|you|i|me|him|her|us|them|my|your|his|her|its|our|their|mine|yours|his|hers|ours|theirs)$/i, pos: 'pron.' },
  { pattern: /^(is|am|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|can|need|dare|ought)$/i, pos: 'aux.' },
  { pattern: /^(and|or|but|so|for|nor|yet|because|although|though|if|when|while|since|until|unless|as|than|that|which|who|whom|whose|what|where|why|how)$/i, pos: 'conj.' },
  { pattern: /^(to|from|in|on|at|by|for|with|about|against|between|through|under|above|below|near|of|off|up|down|out|into|over|after|before|during|without)$/i, pos: 'prep.' },
];

const POS_SUFFIXES: Array<{ suffix: string; pos: string }> = [
  { suffix: 'tion', pos: 'n.' },
  { suffix: 'sion', pos: 'n.' },
  { suffix: 'ment', pos: 'n.' },
  { suffix: 'ness', pos: 'n.' },
  { suffix: 'ity', pos: 'n.' },
  { suffix: 'er', pos: 'n.' },
  { suffix: 'or', pos: 'n.' },
  { suffix: 'ist', pos: 'n.' },
  { suffix: 'ism', pos: 'n.' },
  { suffix: 'able', pos: 'adj.' },
  { suffix: 'ible', pos: 'adj.' },
  { suffix: 'ful', pos: 'adj.' },
  { suffix: 'ous', pos: 'adj.' },
  { suffix: 'ive', pos: 'adj.' },
  { suffix: 'al', pos: 'adj.' },
  { suffix: 'ly', pos: 'adv.' },
  { suffix: 'ize', pos: 'v.' },
  { suffix: 'ise', pos: 'v.' },
  { suffix: 'ate', pos: 'v.' },
];

function guessPOS(word: string): string {
  const lowerWord = word.toLowerCase();

  for (const { pattern, pos } of POS_PATTERNS) {
    if (pattern.test(lowerWord)) {
      return pos;
    }
  }

  for (const { suffix, pos } of POS_SUFFIXES) {
    if (lowerWord.endsWith(suffix)) {
      return pos;
    }
  }

  return '';
}

const MD5_TABLE: number[] = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
  0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
  0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
  0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
  0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
  0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
  0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
  0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
  0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

const MD5_ROUNDS: number[] = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

function stringToUTF8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push((charCode >> 6) | 0xC0);
      bytes.push((charCode & 0x3F) | 0x80);
    } else if (charCode < 0x10000) {
      bytes.push((charCode >> 12) | 0xE0);
      bytes.push(((charCode >> 6) & 0x3F) | 0x80);
      bytes.push((charCode & 0x3F) | 0x80);
    } else {
      bytes.push((charCode >> 18) | 0xF0);
      bytes.push(((charCode >> 12) & 0x3F) | 0x80);
      bytes.push(((charCode >> 6) & 0x3F) | 0x80);
      bytes.push((charCode & 0x3F) | 0x80);
    }
  }
  return bytes;
}

function md5(input: string): string {
  const bytes = stringToUTF8Bytes(input);
  const origLengthInBits = bytes.length * 8;

  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  const lowBits = origLengthInBits & 0xffffffff;
  const highBits = Math.floor(origLengthInBits / 0x100000000) & 0xffffffff;

  bytes.push(lowBits & 0xff);
  bytes.push((lowBits >>> 8) & 0xff);
  bytes.push((lowBits >>> 16) & 0xff);
  bytes.push((lowBits >>> 24) & 0xff);

  bytes.push(highBits & 0xff);
  bytes.push((highBits >>> 8) & 0xff);
  bytes.push((highBits >>> 16) & 0xff);
  bytes.push((highBits >>> 24) & 0xff);

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let i = 0; i < bytes.length; i += 64) {
    const chunk = bytes.slice(i, i + 64);
    const words: number[] = [];
    for (let j = 0; j < 64; j += 4) {
      words.push((chunk[j] | (chunk[j + 1] << 8) | (chunk[j + 2] << 16) | (chunk[j + 3] << 24)) >>> 0);
    }

    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    for (let j = 0; j < 64; j++) {
      let f = 0;
      let g = 0;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }

      const temp = d;
      d = c;
      c = b;

      const sum = (a + f + MD5_TABLE[j] + words[g]) >>> 0;
      const s = MD5_ROUNDS[j];
      const rotated = ((sum << s) | (sum >>> (32 - s))) >>> 0;
      b = (b + rotated) >>> 0;

      a = temp;
    }

    a = (a + aa) >>> 0;
    b = (b + bb) >>> 0;
    c = (c + cc) >>> 0;
    d = (d + dd) >>> 0;
  }

  const toHex = (n: number) => {
    const b1 = n & 0xff;
    const b2 = (n >>> 8) & 0xff;
    const b3 = (n >>> 16) & 0xff;
    const b4 = (n >>> 24) & 0xff;
    return [b1, b2, b3, b4].map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
}

// ---- 本地缓存：音标/词性/翻译/例句，降低重复请求与限流概率，API 抖动时仍可秒显 ----
const DICT_CACHE_KEY = 'dict_cache_v1';
const DICT_CACHE_TTL = 30 * 24 * 3600 * 1000; // 30 天
type CacheEntry = { phonetic?: string; phoneticUK?: string; pos?: string; chinese?: string; examples?: string[]; ts: number };
let memCache: Record<string, CacheEntry> | null = null;
function loadCache(): Record<string, CacheEntry> {
  if (memCache) return memCache;
  try {
    memCache = JSON.parse(localStorage.getItem(DICT_CACHE_KEY) || '{}');
  } catch {
    memCache = {};
  }
  return memCache;
}
function saveCache() {
  try {
    localStorage.setItem(DICT_CACHE_KEY, JSON.stringify(memCache));
  } catch {
    /* 忽略隐私模式等写入失败 */
  }
}
function cacheGet(word: string): CacheEntry | undefined {
  const c = loadCache()[word.toLowerCase()];
  if (c && Date.now() - c.ts < DICT_CACHE_TTL) return c;
  return undefined;
}
function cacheSet(word: string, e: Partial<CacheEntry>) {
  const c = loadCache();
  const merged: CacheEntry = { ...c[word.toLowerCase()] } as CacheEntry;
  for (const [k, v] of Object.entries(e)) {
    if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
  }
  merged.ts = Date.now();
  c[word.toLowerCase()] = merged;
  saveCache();
}

// ---- 全局翻译限流：串行化所有 /api/baidu-translate 出站请求，避免批量加词并发超 QPS ----
let throttleChain: Promise<void> = Promise.resolve();
let lastTranslate = 0;
const TRANSLATE_INTERVAL = 120; // ms ≈ 8 QPS，低于百度限制
function throttleTranslate(): Promise<void> {
  const run = throttleChain.then(async () => {
    const wait = Math.max(0, TRANSLATE_INTERVAL - (Date.now() - lastTranslate));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastTranslate = Date.now();
  });
  throttleChain = run.catch(() => {});
  return run;
}

export function useDictionary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranslation = useCallback(async (english: string, retryCount: number = 0): Promise<string> => {
    const key = english.trim().toLowerCase();
    const cached = cacheGet(key);
    if (cached?.chinese) return cached.chinese;
    try {
      await throttleTranslate();
      const { baiduAppId, baiduKey } = useWordStore.getState().config;
      const salt = Date.now().toString();
      const sign = md5(baiduAppId + english + salt + baiduKey);

      const params = new URLSearchParams({
        q: english,
        from: 'en',
        to: 'zh',
        appid: baiduAppId,
        salt,
        sign,
      });

      const response = await fetch(`/api/baidu-translate?${params}`);
      const data: BaiduResponse = await response.json();

      if (data.error_code) {
        if (data.error_code === '54001' || data.error_code === '54003' || data.error_code === '54004') {
          if (retryCount < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * (retryCount + 1)));
            return fetchTranslation(english, retryCount + 1);
          }
        }
        return '暂无释义';
      }

      if (data.trans_result && data.trans_result.length > 0) {
        const dst = data.trans_result[0].dst;
        cacheSet(key, { chinese: dst });
        return dst;
      }

      return '暂无释义';
    } catch {
      if (retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchTranslation(english, retryCount + 1);
      }
      return '暂无释义';
    }
  }, []);

  // 音标 / 词性 / 例句：优先走服务端 /api/dictionary（含国内有道兜底，境内可达），失败再直连 dictionaryapi.dev
  const fetchPhonetics = useCallback(async (english: string): Promise<{ phonetic?: string; phoneticUK?: string; pos: string; examples?: string[] }> => {
    const key = english.trim().toLowerCase();
    const cached = cacheGet(key);
    if (cached && (cached.phonetic || cached.phoneticUK || cached.pos || (cached.examples && cached.examples.length))) {
      return { phonetic: cached.phonetic, phoneticUK: cached.phoneticUK, pos: cached.pos || '', examples: cached.examples };
    }
    const word = english.trim();

    const collectExamples = (data: unknown): string[] => {
      const out: string[] = [];
      if (Array.isArray(data)) {
        for (const w of data as Array<{ meanings?: Array<{ definitions?: Array<{ example?: string }> }> }>) {
          for (const m of w.meanings || []) {
            for (const d of m.definitions || []) {
              if (d.example && out.length < 3 && !out.includes(d.example)) out.push(d.example);
            }
          }
        }
      }
      return out;
    };

    try {
      const dr = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(5000) });
      if (dr.ok) {
        const dict = await dr.json();
        const phonetic = typeof dict.phonetic === 'string' && dict.phonetic ? dict.phonetic : undefined;
        const phoneticUK = typeof dict.phoneticUK === 'string' && dict.phoneticUK ? dict.phoneticUK : undefined;
        const pos = typeof dict.pos === 'string' ? dict.pos : '';
        const examples = Array.isArray(dict.examples)
          ? dict.examples.filter((e: unknown): e is string => typeof e === 'string').slice(0, 3)
          : undefined;
        if (phonetic || phoneticUK || pos || (examples && examples.length)) {
          cacheSet(key, { phonetic, phoneticUK, pos, examples });
          return { phonetic, phoneticUK, pos, examples };
        }
      }
    } catch {}
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(4000) });
      const data = await r.json();
      if (Array.isArray(data) && data[0]) {
        const w = data[0];
        const strip = (s: string) => s.replace(/^\/|\/$/g, '').trim();
        let phonetic = w.phonetic ? strip(w.phonetic) : undefined;
        if (Array.isArray(w.phonetics)) {
          const us = w.phonetics.find((p: { audio?: string; text?: string }) => p.audio && p.audio.includes('-us') && p.text);
          const any = w.phonetics.find((p: { text?: string }) => p.text);
          if (us?.text) phonetic = strip(us.text);
          else if (!phonetic && any?.text) phonetic = strip(any.text);
        }
        const pos = w.meanings && w.meanings[0]?.partOfSpeech
          ? (POS_MAP[w.meanings[0].partOfSpeech] || w.meanings[0].partOfSpeech)
          : '';
        const examples = collectExamples(data);
        if (phonetic || pos || examples.length) {
          cacheSet(key, { phonetic, phoneticUK: undefined, pos, examples });
          return { phonetic, phoneticUK: undefined, pos, examples };
        }
      }
    } catch {}
    return { phonetic: undefined, phoneticUK: undefined, pos: '', examples: undefined };
  }, []);

  const fetchWordInfo = useCallback(async (english: string): Promise<{ chinese: string; pos: string; phonetic?: string; phoneticUK?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const [translationRes, phoneticsRes] = await Promise.all([
        fetchTranslation(english),
        fetchPhonetics(english).catch(() => ({ phonetic: undefined, phoneticUK: undefined, pos: '' })),
      ]);

      const chinese = translationRes || '暂无释义';
      const { phonetic, phoneticUK, pos } = phoneticsRes;

      return { chinese, pos: pos || guessPOS(english), phonetic, phoneticUK };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch word info');
      const chinese = await fetchTranslation(english);
      return { chinese, pos: guessPOS(english) };
    } finally {
      setLoading(false);
    }
  }, [fetchTranslation, fetchPhonetics]);

  const createWord = useCallback(async (english: string): Promise<Word> => {
    const { chinese, pos, phonetic, phoneticUK } = await fetchWordInfo(english);
    return {
      id: Date.now().toString() + Math.random(),
      english: english.trim(),
      chinese,
      pos,
      phonetic,
      phoneticUK,
      createdAt: Date.now(),
    };
  }, [fetchWordInfo]);

  const updateWordTranslation = useCallback(async (word: Word): Promise<{ chinese: string; pos: string; phonetic?: string; phoneticUK?: string }> => {
    const { chinese, pos, phonetic, phoneticUK } = await fetchWordInfo(word.english);
    return { chinese, pos, phonetic, phoneticUK };
  }, [fetchWordInfo]);

  return { fetchWordInfo, fetchPhonetics, createWord, updateWordTranslation, loading, error };
}
