import { useState } from 'react';
import { X, Plus, Loader2, CheckCircle } from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import { useWordStore } from '../stores/wordStore';

interface BatchAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchAddModal({ isOpen, onClose }: BatchAddModalProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [addedCount, setAddedCount] = useState(0);
  const { createWord } = useDictionary();
  const { addWords } = useWordStore();

  const handleSubmit = async () => {
    const lines = inputText.trim().split('\n');
    const words = lines
      .map((line) => line.trim())
      .filter((word) => word.length > 0 && /^[a-zA-Z\s-]+$/.test(word));

    if (words.length === 0) {
      alert('请输入有效的英文单词');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setAddedCount(0);

    const newWords = [];
    const batchSize = 5;

    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, Math.min(i + batchSize, words.length));
      const batchResults = await Promise.all(
        batch.map((word) => createWord(word))
      );
      newWords.push(...batchResults);
      setAddedCount(newWords.length);
      setProgress(Math.round(((i + batchSize) / words.length) * 100));
    }

    addWords(newWords);
    setIsProcessing(false);
    setInputText('');
    onClose();
  };

  const wordCount = inputText.trim().split('\n').filter((line) => line.trim().length > 0).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">批量添加单词</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-3">每行输入一个英文单词，系统会自动获取中文释义和词性</p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="apple&#10;beautiful&#10;quickly&#10;run&#10;happiness"
            className="w-full h-48 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-500">
              {wordCount} 个单词待添加
            </span>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">正在添加...</span>
                <span className="text-sm font-medium text-blue-600">
                  {addedCount} / {progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isProcessing || wordCount === 0}
            className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                添加中...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                批量添加 ({wordCount})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}