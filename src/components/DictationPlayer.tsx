import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { Word, DictationSettings, DictationResult } from '../types';
import { useSpeech } from '../hooks/useSpeech';

interface DictationPlayerProps {
  words: Word[];
  settings: DictationSettings;
  onComplete: (results: DictationResult[]) => void;
}

export function DictationPlayer({ words, settings, onComplete }: DictationPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<DictationResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const { speakEnglish, speakChinese, stop } = useSpeech();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentWord = words[currentIndex];

  const speakCurrent = useCallback(() => {
    if (!currentWord) return;
    
    if (settings.mode === 'chinese') {
      speakChinese(currentWord.chinese, settings.speed);
    } else {
      speakEnglish(currentWord.english, settings.speed);
    }
  }, [currentWord, settings, speakChinese, speakEnglish]);

  useEffect(() => {
    if (isPlaying && currentWord) {
      speakCurrent();
      setPlayCount(1);
    }
  }, [isPlaying, currentWord, speakCurrent]);

  useEffect(() => {
    inputRef.current?.focus();
    if (currentWord) {
      setTimeout(() => {
        setIsPlaying(true);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      if (playCount < settings.repeatCount) {
        timeoutRef.current = setTimeout(() => {
          speakCurrent();
          setPlayCount((prev) => prev + 1);
        }, settings.interval * 1000);
      } else if (settings.type === 'offline') {
        // Auto-advance after repeatCount is finished in offline mode
        timeoutRef.current = setTimeout(() => {
          handleNext();
        }, settings.interval * 1000);
      }
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [playCount, isPlaying, settings, speakCurrent, currentIndex]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSubmit = () => {
    stop();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const isCorrect = settings.mode === 'chinese'
      ? userAnswer.trim().toLowerCase() === currentWord.english.toLowerCase()
      : userAnswer.trim() === currentWord.chinese;

    const result: DictationResult = {
      word: currentWord,
      userAnswer: userAnswer.trim(),
      isCorrect,
    };

    setResults((prev) => [...prev, result]);
    setShowResult(true);
  };

  const handleNext = () => {
    if (settings.type === 'offline') {
      const result: DictationResult = {
        word: currentWord,
        userAnswer: '',
        isCorrect: true,
      };
      setResults((prev) => {
        const alreadyExists = prev.some(r => r.word.id === currentWord.id);
        const updated = alreadyExists ? prev : [...prev, result];
        
        if (currentIndex < words.length - 1) {
          setCurrentIndex((prevIdx) => prevIdx + 1);
          setUserAnswer('');
          setShowResult(false);
          setPlayCount(0);
          setIsPlaying(true);
        } else {
          onComplete(updated);
        }
        return updated;
      });
    } else {
      if (currentIndex < words.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setUserAnswer('');
        setShowResult(false);
        setPlayCount(0);
        setIsPlaying(true);
      } else {
        onComplete(results);
      }
    }
    inputRef.current?.focus();
  };

  const progress = ((currentIndex + 1) / words.length) * 100;
  const correctCount = results.filter((r) => r.isCorrect).length;

  if (!currentWord) {
    return <div className="text-center text-gray-500">没有单词</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            进度: {currentIndex + 1} / {words.length}
          </span>
          {settings.type !== 'offline' && (
            <span className="text-sm font-medium text-green-600">
              正确: {correctCount}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-4">
            <Volume2 className={`w-10 h-10 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            {settings.type === 'offline'
              ? (settings.mode === 'chinese' ? '听中文，在纸上写出英文' : '听英文，在纸上写出中文')
              : (settings.mode === 'chinese' ? '听中文，写出英文单词' : '听英文，写出中文释义')}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handlePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
          <button
            onClick={speakCurrent}
            className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {settings.type !== 'offline' && (
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !showResult && handleSubmit()}
              placeholder={settings.mode === 'chinese' ? '输入英文单词...' : '输入中文释义...'}
              disabled={showResult}
              className="w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50"
              autoFocus
            />
          </div>
        )}

        {settings.type === 'offline' ? (
          <div className="p-6 bg-blue-50/50 rounded-xl mb-4 text-center border border-dashed border-blue-200">
            <p className="text-blue-700 font-semibold mb-1">✍️ 线下听写中</p>
            <p className="text-xs text-gray-500">请在本子上写下答案。播报完成后可显示答案列表。</p>
          </div>
        ) : showResult ? (
          <div className={`p-4 rounded-xl mb-4 ${currentWord ? '' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              {results[results.length - 1]?.isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span className={`font-semibold ${
                results[results.length - 1]?.isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                {results[results.length - 1]?.isCorrect ? '回答正确!' : '回答错误'}
              </span>
            </div>
            {!results[results.length - 1]?.isCorrect && currentWord && (
              <div className="text-sm text-gray-600">
                <p>正确答案: <span className="font-medium">{
                  settings.mode === 'chinese' ? currentWord.english : currentWord.chinese
                }</span></p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            提交答案
          </button>
        )}

        <button
          onClick={handleNext}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          {currentIndex < words.length - 1 ? (
            <>
              <SkipForward className="w-5 h-5" />
              下一题
            </>
          ) : (
            '完成听写'
          )}
        </button>
      </div>
    </div>
  );
}