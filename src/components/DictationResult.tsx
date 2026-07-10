import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Home, Volume2, Eye } from 'lucide-react';
import { DictationResult as ResultType, DictationSettings } from '../types';
import { useSpeech } from '../hooks/useSpeech';

interface DictationResultProps {
  results: ResultType[];
  settings: DictationSettings;
  onRestart: () => void;
  onHome: () => void;
}

export function DictationResult({ results, settings, onRestart, onHome }: DictationResultProps) {
  const { speakEnglish, speakChinese } = useSpeech();
  const [showOfflineAnswers, setShowOfflineAnswers] = useState(false);
  
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalCount = results.length;
  const accuracy = Math.round((correctCount / totalCount) * 100);

  const handleSpeak = (result: ResultType) => {
    if (settings.mode === 'chinese') {
      speakEnglish(result.word.english, settings.speed);
    } else {
      speakChinese(result.word.chinese, settings.speed);
    }
  };

  const getGrade = () => {
    if (accuracy >= 90) return { text: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
    if (accuracy >= 70) return { text: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (accuracy >= 60) return { text: '及格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: '需努力', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const grade = getGrade();

  if (settings.type === 'offline') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 mb-4 text-blue-500">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">线下听写已完成！</h2>
          <p className="text-sm text-gray-500 mb-4">
            共播报了 {totalCount} 个单词，请点击下方按钮核对你的纸面答案。
          </p>
          
          {!showOfflineAnswers && (
            <button
              onClick={() => setShowOfflineAnswers(true)}
              className="px-6 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              显示听写答案
            </button>
          )}
        </div>

        {showOfflineAnswers && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
              正确答案 (含词性与翻译)
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 font-medium w-6">{index + 1}.</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{result.word.english}</span>
                        {result.word.pos && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                            {result.word.pos}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{result.word.chinese}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => speakEnglish(result.word.english, settings.speed)}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-600 hover:text-blue-600 transition-colors"
                    title="播放发音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onHome}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            返回首页
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            再测一次
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${grade.bg} mb-4`}>
          <span className="text-4xl font-bold text-gray-800">{accuracy}%</span>
        </div>
        <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${grade.bg} ${grade.color} mb-2`}>
          {grade.text}
        </div>
        <p className="text-gray-600">
          正确 {correctCount} / {totalCount} 题
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">答题详情</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{result.word.english}</span>
                    {result.word.pos && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                        {result.word.pos}
                      </span>
                    )}
                    <button
                      onClick={() => handleSpeak(result)}
                      className="p-1 rounded hover:bg-white/50 transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{result.word.chinese}</p>
                  {!result.isCorrect && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50">
                      <p className="text-sm text-gray-500">
                        你的答案: <span className="text-red-600">{result.userAnswer || '(空)'}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onHome}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          返回首页
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          再测一次
        </button>
      </div>
    </div>
  );
}