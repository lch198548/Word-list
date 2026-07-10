import { useState, useCallback, useRef } from 'react';
import { Word } from '../types';
import { useWordStore } from '../stores/wordStore';

interface DictionaryResponse {
  word: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
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

const QPS_LIMIT = 10;
const REQUEST_INTERVAL = 1000 / QPS_LIMIT;

export function useDictionary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestTime = useRef(0);

  const fetchTranslation = useCallback(async (english: string, retryCount: number = 0): Promise<string> => {
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      if (timeSinceLastRequest < REQUEST_INTERVAL) {
        await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL - timeSinceLastRequest));
      }
      lastRequestTime.current = Date.now();

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
        return data.trans_result[0].dst;
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

  const fetchWordInfo = useCallback(async (english: string): Promise<{ chinese: string; pos: string }> => {
    setLoading(true);
    setError(null);

    try {
      const [translationRes, dictionaryRes] = await Promise.all([
        fetchTranslation(english),
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(english)}`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      const chinese = translationRes || '暂无释义';
      
      let pos = '';
      
      if (dictionaryRes && Array.isArray(dictionaryRes) && dictionaryRes.length > 0) {
        const wordData = dictionaryRes[0] as DictionaryResponse;
        if (wordData.meanings && wordData.meanings.length > 0) {
          const firstMeaning = wordData.meanings[0];
          if (firstMeaning.partOfSpeech) {
            pos = POS_MAP[firstMeaning.partOfSpeech] || firstMeaning.partOfSpeech;
          }
        }
      }
      
      if (!pos) {
        pos = guessPOS(english);
      }

      return { chinese, pos };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch word info');
      const chinese = await fetchTranslation(english);
      return { chinese, pos: guessPOS(english) };
    } finally {
      setLoading(false);
    }
  }, [fetchTranslation]);

  const createWord = useCallback(async (english: string): Promise<Word> => {
    const { chinese, pos } = await fetchWordInfo(english);
    return {
      id: Date.now().toString() + Math.random(),
      english: english.trim(),
      chinese,
      pos,
      createdAt: Date.now(),
    };
  }, [fetchWordInfo]);

  const updateWordTranslation = useCallback(async (word: Word): Promise<{ chinese: string; pos: string }> => {
    const { chinese, pos } = await fetchWordInfo(word.english);
    return { chinese, pos };
  }, [fetchWordInfo]);

  return { fetchWordInfo, createWord, updateWordTranslation, loading, error };
}