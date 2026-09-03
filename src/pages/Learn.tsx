import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { WordStudyCard } from '../components/WordStudyCard';
import { useWordStore } from '../stores/wordStore';
import { Word } from '../types';
import { findSimilarWords } from '../lib/phonetics';
import type { Accent, SpeechSpeed } from '../hooks/usePronunciation';

interface LearnProps {
  onNavigate: (path: string) => void;
}

const SWIPE_THRESHOLD = 50;

export default function Learn({ onNavigate }: LearnProps) {
  const { words, updateWord } = useWordStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accent, setAccent] = useState<Accent>('us');
  const [speed, setSpeed] = useState<SpeechSpeed>('normal');
  const [direction, setDirection] = useState<'next' | 'prev' | 'none'>('none');

  // 左右滑动切词（触摸 + 指针）
  const swipeRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const swipedRef = useRef(false);

  const goPrev = () => {
    setDirection('prev');
    setCurrentIndex((i) => Math.max(0, Math.min(studyWords.length - 1, i - 1)));
  };
  const goNext = () => {
    setDirection('next');
    setCurrentIndex((i) => Math.max(0, Math.min(studyWords.length - 1, i + 1)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, active: true };
    swipedRef.current = false;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!swipeRef.current.active) return;
    const dx = e.clientX - swipeRef.current.x;
    const dy = e.clientY - swipeRef.current.y;
    swipeRef.current.active = false;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true; // 抑制随后触发的 click（避免误翻面）
      if (dx < 0) goNext();
      else goPrev();
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (swipedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      swipedRef.current = false;
    }
  };

  // 学习列表取自已勾选的单词（与听写一致），并跟随 store 实时更新
  const studyWords = useMemo(
    () => words.filter((w) => w.selected !== false),
    [words],
  );

  useEffect(() => {
    if (studyWords.length === 0) {
      alert('请先添加并勾选单词，再开始学习');
      onNavigate('/');
    }
    // 仅在进入时校验一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJump = (id: string) => {
    const idx = studyWords.findIndex((w) => w.id === id);
    if (idx >= 0) {
      setDirection(idx >= safeIndex ? 'next' : 'prev');
      setCurrentIndex(idx);
    }
  };

  if (studyWords.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" />
    );
  }

  // 索引越界保护（列表变化时的兜底）
  const safeIndex = Math.min(currentIndex, studyWords.length - 1);
  const current: Word = studyWords[safeIndex];
  const similar = findSimilarWords(current.english, studyWords);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">卡片学习</h1>
                <p className="text-xs text-gray-500">一页一词 · 点读发音</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 进度条 */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((safeIndex + 1) / studyWords.length) * 100}%` }}
          />
        </div>

        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeRef.current.active = false)}
          onClickCapture={onClickCapture}
          style={{ touchAction: 'pan-y' }}
        >
          <WordStudyCard
            key={current.id}
            direction={direction}
            word={current}
            index={safeIndex + 1}
            total={studyWords.length}
            similar={similar}
            accent={accent}
            speed={speed}
            onAccentChange={setAccent}
            onSpeedChange={setSpeed}
            onJump={handleJump}
            onUpdateWord={updateWord}
          />
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          ← 左右滑动卡片切换单词 →
        </p>

        {/* 上下切换 */}
        <div className="flex gap-3 mt-4">
          <button
            disabled={safeIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="flex-1 py-3 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            上一个
          </button>
          <button
            disabled={safeIndex === studyWords.length - 1}
            onClick={() =>
              setCurrentIndex((i) => Math.min(studyWords.length - 1, i + 1))
            }
            className="flex-1 py-3 bg-white rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一个
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
