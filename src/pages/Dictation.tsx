import { useState } from 'react';
import { ArrowLeft, Headphones } from 'lucide-react';
import { DictationPlayer } from '../components/DictationPlayer';
import { DictationResult } from '../components/DictationResult';
import { useWordStore } from '../stores/wordStore';
import { DictationResult as ResultType } from '../types';

interface DictationProps {
  onNavigate: (path: string) => void;
}

export default function Dictation({ onNavigate }: DictationProps) {
  const { getWordsForDictation, settings } = useWordStore();
  const [words, setWords] = useState(() => getWordsForDictation());
  const [results, setResults] = useState<ResultType[]>([]);
  const [isFinished, setIsFinished] = useState(false);

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