import { Trash2, Edit3, Volume2, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Word } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { useWordStore } from '../stores/wordStore';
import { useDictionary } from '../hooks/useDictionary';

interface WordCardProps {
  word: Word;
  index: number;
  onEdit?: () => void;
}

export function WordCard({ word, index, onEdit }: WordCardProps) {
  const { speakEnglish } = useSpeech();
  const { removeWord, settings, updateWord } = useWordStore();
  const { updateWordTranslation, loading } = useDictionary();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const clearTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // 展开后，点击卡片外部收起动作条
  useEffect(() => {
    if (!revealed) return;
    const onDocDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setRevealed(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [revealed]);

  // 长按 450ms 显示编辑/删除
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('input, [data-action-btn]')) return;
    longPressed.current = false;
    clearTimer();
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setRevealed(true);
    }, 450);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (Math.abs(e.movementX) > 8 || Math.abs(e.movementY) > 8) clearTimer();
  };
  const handlePointerUp = () => clearTimer();
  const handlePointerLeave = () => clearTimer();

  // 移动端左滑展开
  const startX = useRef(0);
  const startY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (dx < -50 && Math.abs(dx) > Math.abs(dy)) setRevealed(true);
  };

  // 点击单词区域：朗读（长按后吞掉紧随的 click，避免误触发音）
  const handleCardClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    speakEnglish(word.english, settings.speed);
  };

  const handleDelete = () => {
    if (window.confirm(`确定删除单词 "${word.english}" 吗？`)) {
      removeWord(word.id);
    }
  };

  const handleRefreshTranslation = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const { chinese, pos, phonetic, phoneticUK } = await updateWordTranslation(word);
      updateWord(word.id, { chinese, pos, phonetic, phoneticUK });
    } finally {
      setIsRefreshing(false);
    }
  };

  const needRetry = word.chinese === '暂无释义' || !word.chinese;
  const isSelected = word.selected !== false;
  const isSingleWord = !word.english.includes(' ') && word.english.length <= 30;

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md select-none ${
        revealed ? 'border-blue-300' : 'border-gray-100 hover:border-blue-200'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => updateWord(word.id, { selected: isSelected ? false : true })}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0 mt-1"
          />
          <span className="text-sm font-semibold text-gray-400 w-5 text-right flex-shrink-0">{index}.</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex-1 min-w-0 text-left group"
            aria-label="播放发音（长按显示编辑/删除）"
          >
            <div className="flex items-start gap-2">
              <div className="p-1.5 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 transition-colors flex-shrink-0 mt-0.5">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-gray-800 break-words">{word.english}</span>
                  {word.pos && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      {word.pos}
                    </span>
                  )}
                </div>
                {isSingleWord && word.phonetic && (
                  <div className="text-sm text-gray-400 mt-0.5 font-mono">
                    {word.phonetic}
                  </div>
                )}
                <div className="flex items-start gap-2 mt-1">
                  <p className={`text-sm ${needRetry ? 'text-gray-400' : 'text-gray-600'}`}>
                    {word.chinese || '暂无释义'}
                  </p>
                  {needRetry && (
                    <button
                      data-action-btn
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshTranslation();
                      }}
                      disabled={isRefreshing || loading}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5"
                      aria-label="重试翻译"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 编辑/删除：默认折叠，长按或左滑后展开 */}
        <div
          className={`flex items-center gap-1 flex-shrink-0 overflow-hidden transition-all duration-300 ${
            revealed ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          {onEdit && (
            <button
              data-action-btn
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(false);
                onEdit();
              }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="编辑"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            data-action-btn
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(false);
              handleDelete();
            }}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {revealed && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          点击空白处收起 · 编辑 / 删除已就绪
        </div>
      )}
    </div>
  );
}
