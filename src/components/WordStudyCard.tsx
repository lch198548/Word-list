import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, RefreshCw, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Word } from '../types';
import { usePronunciation, type Accent, type SpeechSpeed } from '../hooks/usePronunciation';
import { useDictionary } from '../hooks/useDictionary';

interface WordStudyCardProps {
  direction: 'next' | 'prev' | 'none';
  word: Word;
  index: number;
  total: number;
  similar: { id: string; english: string }[];
  accent: Accent;
  speed: SpeechSpeed;
  onAccentChange: (a: Accent) => void;
  onSpeedChange: (s: SpeechSpeed) => void;
  onJump: (id: string) => void;
  onUpdateWord: (id: string, updates: Partial<Word>) => void;
}

const SPEEDS: SpeechSpeed[] = ['slow', 'normal', 'medium', 'fast'];
const SPEED_LABEL: Record<SpeechSpeed, string> = {
  slow: '慢',
  normal: '常',
  medium: '中',
  fast: '快',
};

export function WordStudyCard({
  direction,
  word,
  index,
  total,
  similar,
  accent,
  speed,
  onAccentChange,
  onSpeedChange,
  onJump,
  onUpdateWord,
}: WordStudyCardProps) {
  const { speak } = usePronunciation();
  const { fetchPhonetics, loading } = useDictionary();
  const handleSpeak = () => speak(word.english, accent, speed);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [examples, setExamples] = useState<string[]>([]);
  // 隐藏单词 + 中文信息（点击单词或中文切换，切换时读一遍英文）
  const [hidden, setHidden] = useState(false);

  // 缺音标/词性时自动补齐并写回（防 StrictMode 双拉）
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    if (!word.phonetic || !word.pos) {
      fetchPhonetics(word.english)
        .then((info) => {
          if (info.phonetic || info.phoneticUK || info.pos) {
            onUpdateWord(word.id, {
              phonetic: info.phonetic,
              phoneticUK: info.phoneticUK,
              pos: info.pos,
            });
          }
          setExamples(info.examples || []);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  // 切换单词时重置隐藏状态
  useEffect(() => {
    setHidden(false);
    setExamples([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  const toggleHidden = useCallback(() => {
    setHidden((h) => !h);
    // 隐藏/还原都读一遍英文
    speak(word.english, accent, speed);
  }, [word.english, accent, speed, speak]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const info = await fetchPhonetics(word.english);
      onUpdateWord(word.id, {
        phonetic: info.phonetic,
        phoneticUK: info.phoneticUK,
        pos: info.pos,
      });
      setExamples(info.examples || []);
    } catch {}
    setIsRefreshing(false);
  };

  const phonetic =
    accent === 'uk'
      ? word.phoneticUK || word.phonetic
      : word.phonetic || word.phoneticUK;

  const animClass =
    direction === 'next' ? 'card-enter-next' : direction === 'prev' ? 'card-enter-prev' : '';

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${animClass}`}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold text-gray-400">
          {index} / {total}
        </span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
          aria-label="刷新音标"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <button
          onClick={handleSpeak}
          className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors flex-shrink-0"
          aria-label="播放发音"
        >
          <Volume2 className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          {/* 单词：点击隐藏/还原（同时读英文） */}
          <div
            onClick={toggleHidden}
            className="inline-flex flex-wrap items-center gap-2 cursor-pointer select-none rounded-lg px-1 -mx-1 hover:bg-gray-50 transition-colors"
            title="点击隐藏 / 显示单词"
          >
            <h2
              className={`text-3xl font-bold break-words ${
                hidden ? 'text-gray-300 tracking-[0.3em]' : 'text-gray-800'
              }`}
            >
              {hidden ? '＿＿＿＿＿' : word.english}
            </h2>
            {word.pos && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                {word.pos}
              </span>
            )}
            {hidden ? (
              <Eye className="w-4 h-4 text-gray-300" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-300" />
            )}
          </div>
          {!hidden && phonetic && (
            <div className="text-lg text-gray-400 mt-1 font-mono">/{phonetic}/</div>
          )}

          {/* 中文释义：点击隐藏/还原（同时读英文） */}
          <div
            onClick={toggleHidden}
            className="mt-2 inline-block cursor-pointer select-none rounded-lg px-1 -mx-1 hover:bg-gray-50 transition-colors"
            title="点击隐藏 / 显示释义"
          >
            {hidden ? (
              <span className="text-base text-gray-300">轻点显示释义</span>
            ) : (
              <p className="text-base text-gray-600">{word.chinese || '暂无释义'}</p>
            )}
          </div>
        </div>
      </div>

      {/* 英美音切换 */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-xs text-gray-400">口音</span>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onAccentChange('us')}
            className={`px-3 py-1 text-sm ${
              accent === 'us' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            美音
          </button>
          <button
            onClick={() => onAccentChange('uk')}
            className={`px-3 py-1 text-sm ${
              accent === 'uk' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            英音
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-gray-400">语速</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-xs rounded ${
                speed === s ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 例句 */}
      {examples.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-gray-400 mb-2">例句</p>
          <ul className="space-y-2">
            {examples.map((ex, i) => (
              <li
                key={i}
                className="text-sm text-gray-600 leading-relaxed border-l-2 border-blue-200 pl-3"
              >
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 形近/易混词 */}
      {similar.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-gray-400 mb-2">易混词（点击跳转）</p>
          <div className="flex flex-wrap gap-2">
            {similar.map((w) => (
              <button
                key={w.id}
                onClick={() => onJump(w.id)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 rounded-full text-sm flex items-center gap-1 transition-colors"
              >
                {w.english}
                <ArrowRight className="w-3 h-3 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
