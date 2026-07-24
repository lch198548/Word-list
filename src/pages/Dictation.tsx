import { useState, useEffect } from 'react';
import { ArrowLeft, Headphones } from 'lucide-react';
import { DictationPlayer } from '../components/DictationPlayer';
import { DictationResult } from '../components/DictationResult';
import { useWordStore } from '../stores/wordStore';
import { DictationResult as ResultType, Word } from '../types';

interface DictationProps {
  onNavigate: (path: string) => void;
}

export default function Dictation({ onNavigate }: DictationProps) {
  const { getWordsForDictation, settings } = useWordStore();
  const [words, setWords] = useState<Word[]>([]);
  const [results, setResults] = useState<ResultType[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const dictationWords = getWordsForDictation();
    setWords(dictationWords);
  }, []);

  const handleComplete = (dictationResults: ResultType[]) => {
    setResults(dictationResults);
    setIsFinished(true);
  };

  const handleRestart = () => {
    setWords(getWordsForDictation());
    setResults([]);
    setIsFinished(false);
  };

  const handleHome = () => {
    onNavigate('/');
  };

  if (words.length === 0 && !isFinished) {
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">听写练习</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Headphones className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">暂无单词</h2>
            <p className="text-gray-500 mb-6">请先添加单词或选择要听写的单词</p>
            <button
              onClick={() => onNavigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium"
            >
              返回首页
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('确定退出听写吗？进度将不会保存。')) {
                  onNavigate('/');
                }
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">听写练习</h1>
                <p className="text-xs text-gray-500">
                  {settings.mode === 'chinese' ? '听中文写英文' : '听英文写中文'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {isFinished ? (
          <DictationResult
            results={results}
            settings={settings}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        ) : (
          <DictationPlayer
            words={words}
            settings={settings}
            onComplete={handleComplete}
          />
        )}
      </main>
    </div>
  );
}