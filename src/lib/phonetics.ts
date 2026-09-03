/**
 * 音标 / 自然拼读 / 形近词 工具
 * 纯前端、无后端依赖，移动端与 PC 端均可离线运行。
 *
 * 音节拆分策略：
 *  1) 高频词/常见易错词走手写 EXC 例外表（最准确）；
 *  2) -tion/-sion/-cian/-tial/-cial/-cious/-tious 类后缀在词尾前置切分；
 *  3) 其余走音素法则（双元音感知的元音核 + 流音/滑音 onset + 不发音 e / C+le 规则）。
 * 说明：英语音节大量依赖词素边界，纯拼写法则无法覆盖，故用 EXC 表兜住高频词。
 */

// 高频词 / 常见易错词的准确音节拆分（优先于规则）
const EXC: Record<string, string> = {
  classical: 'clas-si-cal', philosopher: 'phi-lo-so-pher', evaluation: 'e-val-u-a-tion',
  manager: 'man-ag-er', ordinary: 'or-di-nar-y', background: 'back-ground',
  significant: 'sig-nif-i-cant', consider: 'con-sid-er', creation: 'cre-a-tion',
  nation: 'na-tion', listen: 'lis-ten', beautiful: 'beau-ti-ful', extraordinary: 'ex-tra-or-di-nar-y',
  laboratory: 'lab-o-ra-to-ry', temperature: 'tem-per-a-ture', phonetic: 'pho-net-ic',
  every: 'ev-er-y', very: 'ver-y', family: 'fam-i-ly', different: 'dif-fer-ent',
  probably: 'prob-a-bly', something: 'some-thing', remember: 're-mem-ber', chocolate: 'choc-o-late',
  animal: 'an-i-mal', camera: 'cam-er-a', hospital: 'hos-pi-tal', vegetable: 'veg-e-ta-ble',
  comfortable: 'com-fort-a-ble', library: 'li-brar-y', available: 'a-vail-a-ble', business: 'busi-ness',
  daughter: 'daugh-ter', elephant: 'el-e-phant', pineapple: 'pine-ap-ple', strawberry: 'straw-ber-ry',
  dictionary: 'dic-tion-ar-y', terrible: 'ter-ri-ble', possible: 'pos-si-ble', favourite: 'fa-vour-ite',
  biology: 'bi-ol-o-gy', science: 'sci-ence', ready: 'read-y', city: 'cit-y', money: 'mon-ey', honey: 'hon-ey',
  // 额外常用词
  necessary: 'nec-es-sar-y', difference: 'dif-fer-ence', experience: 'ex-pe-ri-ence',
  important: 'im-por-tant', government: 'gov-ern-ment', environment: 'en-vi-ron-ment',
  information: 'in-for-ma-tion', education: 'ed-u-ca-tion', position: 'po-si-tion',
  decision: 'de-ci-sion', attention: 'at-ten-tion', question: 'ques-tion', station: 'sta-tion',
  condition: 'con-di-tion', addition: 'ad-di-tion', direction: 'di-rec-tion', election: 'e-lec-tion',
  mention: 'men-tion', motion: 'mo-tion', notion: 'no-tion', pollution: 'pol-lu-tion',
  solution: 'so-lu-tion', revolution: 'rev-o-lu-tion', tradition: 'tra-di-tion',
  // 更多常见易错词（硬编码准确拆分）
  separate: 'sep-a-rate', interesting: 'in-ter-est-ing', wonderful: 'won-der-ful',
  careful: 'care-ful', helpful: 'help-ful', quickly: 'quick-ly', slowly: 'slow-ly',
  finally: 'fi-nal-ly', usually: 'u-su-al-ly', because: 'be-cause', about: 'a-bout',
  around: 'a-round', away: 'a-way', again: 'a-gain', before: 'be-fore', behind: 'be-hind',
  below: 'be-low', between: 'be-tween', computer: 'com-pu-ter', telephone: 'tel-e-phone',
  television: 'tel-e-vi-sion', pronunciation: 'pro-nun-ci-a-tion', congratulations: 'con-grat-u-la-tions',
  especially: 'es-pe-cial-ly', generally: 'gen-er-al-ly', immediately: 'im-me-di-ate-ly',
  responsibility: 're-spon-si-bil-i-ty', opportunity: 'op-por-tu-ni-ty', university: 'u-ni-ver-si-ty',
  elementary: 'el-e-men-ta-ry', February: 'feb-ru-ar-y', military: 'mil-i-ta-ry',
  secretary: 'sec-re-ta-ry', boundary: 'boun-da-ry', century: 'cen-tu-ry',
  chemistry: 'chem-is-try', history: 'his-to-ry', geometry: 'ge-om-e-try', factory: 'fac-to-ry',
  country: 'coun-try', entry: 'en-try', already: 'al-read-y', always: 'al-ways', also: 'al-so',
  although: 'al-though', together: 'to-geth-er', tomorrow: 'to-mor-row', protect: 'pro-tect',
  subject: 'sub-ject', object: 'ob-ject', project: 'pro-ject', reject: 're-ject',
  understand: 'un-der-stand', sentence: 'sen-tence', silence: 'si-lence', violence: 'vi-o-lence',
  evidence: 'ev-i-dence', confidence: 'con-fi-dence', independence: 'in-de-pen-dence',
  intelligence: 'in-tel-li-gence', difficult: 'dif-fi-cult',
  opposite: 'op-po-site', neighbour: 'neigh-bour', colour: 'col-our',
  weather: 'weath-er', whether: 'wheth-er', another: 'an-oth-er', nothing: 'noth-ing',
};

// -tion 类后缀：永远自成音节，切分点稳定地在它们之前
const TION_SUFFIXES = ['tion', 'sion', 'ssion', 'cian', 'tial', 'cial', 'cious', 'tious'];

// 受保护的字母组合（不在其内部断开音节）
const DIGRAPHS = [
  'tch', 'dge', 'ph', 'th', 'sh', 'ch', 'wh', 'ck', 'ng', 'qu', 'gh',
  'sc', 'wr', 'kn', 'mb', 'gn',
];

// 仅这些元音组合合并为同一音节核（双元音）
const DIPHTHONGS = ['ai', 'ay', 'ei', 'ey', 'oi', 'oy', 'ou', 'ow', 'au', 'aw', 'ea', 'ee', 'oo', 'oa', 'ui', 'eu', 'ie', 'ue'];

function isVowelChar(c: string): boolean {
  return 'aeiou'.includes(c);
}

function isVowel(w: string, i: number): boolean {
  const c = w[i];
  if (c !== 'y') return isVowelChar(c);
  const prev = i > 0 ? w[i - 1] : '';
  const next = i < w.length - 1 ? w[i + 1] : '';
  const prevV = prev && isVowelChar(prev);
  const nextV = next && isVowelChar(next);
  if (i === 0) return false; // 词首 y 作辅音 (yes, yard)
  if (i === w.length - 1) return !prevV; // 词尾：前为辅音则 y 为元音 (happy)，前为元音则 y 滑音 (play)
  return !prevV && !nextV; // 词中：两侧皆辅音才为元音 (rhythm)；否则滑音 (beyond)
}

function isDiphthong(w: string, i: number): boolean {
  return i < w.length - 1 && DIPHTHONGS.includes(w.slice(i, i + 2));
}

function isProtected(w: string, start: number): boolean {
  for (const d of DIGRAPHS) {
    if (w.slice(start, start + d.length) === d) return true;
  }
  return false;
}

/** 构造元音核（每个元音恰好一个核；双元音合并为长度为 2 的核） */
function buildNuclei(w: string): Array<{ s: number; e: number }> {
  const nuc: Array<{ s: number; e: number }> = [];
  let i = 0;
  while (i < w.length) {
    if (isVowel(w, i)) {
      if (i + 1 < w.length && isVowel(w, i + 1) && isDiphthong(w, i)) {
        nuc.push({ s: i, e: i + 1 });
        i += 2;
      } else {
        nuc.push({ s: i, e: i });
        i += 1;
      }
    } else {
      i++;
    }
  }
  return nuc;
}

/** 纯音素法则拆分（在词素内部使用，准确率较好） */
function phonoSplit(w: string): string[] {
  if (w.length <= 2) return [w];
  let nuclei = buildNuclei(w);

  // 词尾不发音 e（非 C+le）：把最后的单独 e 核移除，并入前一节
  const endsWithLe = /[bcdfghjklmnpqrstvwxz]le$/.test(w);
  if (
    !endsWithLe &&
    w.endsWith('e') &&
    nuclei.length > 1 &&
    nuclei[nuclei.length - 1].s === w.length - 1 &&
    nuclei[nuclei.length - 1].e === w.length - 1
  ) {
    nuclei.pop();
  }

  if (nuclei.length <= 1) return [w];

  const cuts: number[] = [];
  for (let g = 0; g < nuclei.length - 1; g++) {
    const start = nuclei[g].e + 1; // 两核之间辅音起点
    const end = nuclei[g + 1].s; // 下一核起点（exclusive）
    const gapLen = end - start;
    let cut: number;

    if (gapLen <= 0) {
      cut = end;
    } else if (gapLen === 1) {
      cut = start; // 单辅音作下一音节开头
    } else if (gapLen === 2) {
      if (isProtected(w, start)) {
        cut = start + 2; // 受保护组合整体留给下一节
      } else if ('lrwy'.includes(w[start + 1]) || w[start] === 's') {
        cut = start; // 流音/滑音开头或 s 簇 → 整体作下一节开头
      } else {
        cut = start + 1; // 其余在中间断开
      }
    } else {
      // 3+ 辅音
      if (w.slice(end - 2, end) === 'le') {
        cut = end - 2; // C+le：在 le 前断开
      } else {
        cut = start + 1; // 第一个辅音留在前一节
      }
    }
    cuts.push(cut);
  }

  cuts.sort((a, b) => a - b);
  const parts: string[] = [];
  let prev = 0;
  for (const c of cuts) {
    if (c > prev) {
      parts.push(w.slice(prev, c));
      prev = c;
    }
  }
  if (prev < w.length) parts.push(w.slice(prev));
  return parts.filter((p) => p.length > 0);
}

/**
 * 将英文单词拆分为自然拼读音节块（用于逐块点读）。
 */
export function splitSyllables(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (EXC[w]) return EXC[w].split('-');
  if (w.length <= 2) return [w];

  // -tion 类后缀前置切分（后缀自成音节）
  for (const t of TION_SUFFIXES) {
    if (w.endsWith(t) && w.length - t.length >= 2) {
      return [...phonoSplit(w.slice(0, w.length - t.length)), t];
    }
  }

  return phonoSplit(w);
}

// ---- IPA 按音节拆分（仅用于展示"音标 + 自然拼读"对应）----
const IPA_VOWELS = 'ɑæɛəɪʊʌɔɒeioʊuɐɜɚɝ'.split('');
const IPA_DIPHTHONGS = ['aɪ', 'aʊ', 'eɪ', 'ɔɪ', 'əʊ', 'ɪə', 'eə', 'ʊə', 'oʊ', 'aɪ'];

function ipaNucleiCount(ipa: string): number {
  let s = ipa;
  for (const d of IPA_DIPHTHONGS) s = s.split(d).join('*');
  let n = 0;
  for (const ch of s) {
    if (ch === '*' || IPA_VOWELS.includes(ch)) n++;
  }
  return n;
}

/**
 * 把单词的 IPA 字符串按音节数 count 大致拆分，用于在每个拼读块下显示对应音标。
 * 这是"尽量对齐"的近似：按 IPA 元音核数量均匀分配到 count 段。
 */
export function splitIPASyllables(ipa: string, count: number): string[] {
  if (!ipa || count <= 0) return [];
  let s = ipa.replace(/^[\/]/, '').replace(/[\/]$/, '');
  const total = ipaNucleiCount(s);
  if (total < count) {
    // 元音核不足，退化为按字符均分
    const out: string[] = [];
    const per = Math.max(1, Math.ceil(s.length / count));
    for (let i = 0; i < s.length; i += per) out.push(s.slice(i, i + per));
    return out;
  }
  const perChunk = total / count;
  const out: string[] = [];
  let cur = '';
  let acc = 0;
  let target = perChunk;
  let i = 0;
  while (i < s.length) {
    let step = 1;
    for (const d of IPA_DIPHTHONGS) {
      if (s.startsWith(d, i)) {
        step = d.length;
        break;
      }
    }
    const piece = s.slice(i, i + step);
    const isV = step > 1 || IPA_VOWELS.includes(s[i]);
    cur += piece;
    if (isV) acc++;
    if (acc >= Math.round(target) && out.length < count - 1) {
      out.push(cur);
      cur = '';
      acc = 0;
      target += perChunk;
    }
    i += step;
  }
  if (cur) out.push(cur);
  return out;
}

/** 编辑距离（Levenshtein），用于计算单词拼写相似度 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * 在词库中找出与目标词拼写相近的单词（形近词），一起记。
 * @param target 目标单词
 * @param pool   候选词（需含 id / english），通常传当前词库
 * @param limit  返回数量上限
 */
export function findSimilarWords(
  target: string,
  pool: Array<{ id: string; english: string }>,
  limit = 6,
): Array<{ id: string; english: string }> {
  const t = target.toLowerCase().trim();
  if (!t) return [];
  const maxDist = Math.max(2, Math.round(t.length / 2));
  return pool
    .filter((w) => w.english.toLowerCase() !== t)
    .map((w) => ({ w, d: levenshtein(t, w.english.toLowerCase()) }))
    .filter((x) => x.d >= 1 && x.d <= maxDist)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => ({ id: x.w.id, english: x.w.english }));
}
