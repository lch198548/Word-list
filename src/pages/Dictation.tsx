import { useState } from 'react';
import { ArrowLeft, Headphones } from 'lucide-react';
import { DictationPlayer } from '../components/DictationPlayer';
import { DictationResult } from '../components/DictationResult';
import { DictationSettings } from '../components/DictationSettings';
import { useWordStore } from '../stores/wordStore';
import { DictationResult as ResultType, Word } from '../types';

interface DictationProps {
  onNavigate: (path: string) => void;
}

type Phase = 'config' | 'playing' | 'result';

export default function Dictation({ onNavigate }: DictationProps) {
  const { getWordsForDictation, settings } = useWordStore();
  const [phase, setPhase] = useState<Phase>('config');
  const [words, setWords] = useState<Word[]>([]);
  const [results, setResults] = useState<ResultType[]>([]);

  const selectedCount = getWordsForDictation().length;

  const handleStart = () => {
    const ws = getWordsForDictation();
    if (ws.length === 0) {
      alert('请先在首页勾选要听写的单词');
      return;
    }
    setWords(ws);
    setPhase('playing');
  };

  const handleComplete = (dictationResults: ResultType[]) => {
    setResults(dictationResults);
    setPhase('result');
  };

  const handleRestart = () => {
    const ws = getWordsForDictation();
    setWords(ws);
    setResults([]);
    setPhase('playing');
  };

  const handleHome = () => onNavigate('/');

  const title =
    phase === 'config' ? '听写设置' : phase === 'playing' ? '听写练习' : '听写结果';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (phase === 'playing') {
                  if (window.confirm('确定退出听写吗？进度将不会保存。')) handleHome();
                } else {
                  handleHome();
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
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                {phase === 'config' && (
                  <p className="text-xs text-gray-500">设置参数后开始听写</p>
                )}
                {phase === 'playing' && (
                  <p className="text-xs text-gray-500">
                    {settings.mode === 'chinese' ? '听中文写英文' : '听英文写中文'}
                  </p>
                )}
                {phase === 'result' && (
                  <p className="text-xs text-gray-500">本次听写已完成</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {phase === 'config' && (
          <>
            <DictationSettings />
            <button
              onClick={handleStart}
              disabled={selectedCount === 0}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <Headphones className="w-6 h-6" />
              开始听写（{selectedCount} 个单词）
            </button>
            {selectedCount === 0 && (
              <p className="text-center text-gray-500 text-sm mt-3">
                请先在首页勾选要听写的单词
              </p>
            )}
          </>
        )}

        {phase === 'playing' && (
          <DictationPlayer
            words={words}
            settings={settings}
            onComplete={handleComplete}
          />
        )}

        {phase === 'result' && (
          <DictationResult
            results={results}
            settings={settings}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </main>
    </div>
  );
}
