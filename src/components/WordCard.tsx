import { Trash2, Edit3, Volume2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
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

  const handleDelete = () => {
    if (window.confirm(`确定删除单词 "${word.english}" 吗？`)) {
      removeWord(word.id);
    }
  };

  const handleSpeak = () => {
    speakEnglish(word.english, settings.speed);
  };

  const handleRefreshTranslation = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const { chinese, pos } = await updateWordTranslation(word);
    updateWord(word.id, { chinese, pos });
    setIsRefreshing(false);
  };

  const needRetry = word.chinese === '暂无释义' || !word.chinese;

  const handleToggleSelect = () => {
    updateWord(word.id, { selected: word.selected === false ? true : false });
  };

  const isSelected = word.selected !== false;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3 transition-all duration-300 hover:shadow-md hover:border-blue-200">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggleSelect}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
        />
        <span className="text-sm font-semibold text-gray-400 w-5 text-right flex-shrink-0">{index}.</span>
        
        <button
          onClick={handleSpeak}
          className="flex-1 min-w-0 text-left group"
          aria-label="播放发音"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 transition-colors flex-shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold text-gray-800 truncate">{word.english}</span>
          {word.pos && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              {word.pos}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className={`text-sm truncate ${needRetry ? 'text-gray-400' : 'text-gray-600'}`}>
            {word.chinese || '暂无释义'}
          </p>
          {needRetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefreshTranslation();
              }}
              disabled={isRefreshing || loading}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="重试翻译"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        </button>
      </div>
      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="编辑"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
          aria-label="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}