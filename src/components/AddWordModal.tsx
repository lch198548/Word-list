import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useDictionary } from '../hooks/useDictionary';
import { useWordStore } from '../stores/wordStore';
import { Word } from '../types';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editWord?: Word | null;
}

export function AddWordModal({ isOpen, onClose, editWord }: AddWordModalProps) {
  const [english, setEnglish] = useState('');
  const [chinese, setChinese] = useState('');
  const [pos, setPos] = useState('');
  const { createWord, loading } = useDictionary();
  const { addWord, updateWord } = useWordStore();

  useEffect(() => {
    if (editWord) {
      setEnglish(editWord.english);
      setChinese(editWord.chinese);
      setPos(editWord.pos);
    } else {
      setEnglish('');
      setChinese('');
      setPos('');
    }
  }, [editWord, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim()) return;

    if (editWord) {
      updateWord(editWord.id, { english: english.trim(), chinese, pos });
      onClose();
    } else {
      const word = await createWord(english);
      if (word) {
        addWord(word);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {editWord ? '编辑单词' : '添加单词'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              英文单词 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="输入英文单词"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              中文释义
            </label>
            <input
              type="text"
              value={chinese}
              onChange={(e) => setChinese(e.target.value)}
              placeholder="输入中文释义"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              词性
            </label>
            <input
              type="text"
              value={pos}
              onChange={(e) => setPos(e.target.value)}
              placeholder="如: n., v., adj."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !english.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {editWord ? '保存修改' : '添加单词'}
          </button>
        </form>
      </div>
    </div>
  );
}