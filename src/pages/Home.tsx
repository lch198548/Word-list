import { useState, useEffect, useRef } from 'react';
import { Camera, Plus, FileText, Volume2, Trash2, BookOpen, Layers, FolderPlus, PlayCircle, ChevronDown, Edit3, Check, X } from 'lucide-react';
import { WordCard } from '../components/WordCard';
import { CameraModal } from '../components/CameraModal';
import { AddWordModal } from '../components/AddWordModal';
import { BatchAddModal } from '../components/BatchAddModal';
import { useWordStore } from '../stores/wordStore';
import { Word } from '../types';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const {
    words,
    wordBooks,
    activeBookId,
    clearWords,
    addWordBook,
    removeWordBook,
    setActiveBookId,
    renameWordBook,
    fetchWordBooks,
    toggleAllWordsSelection,
  } = useWordStore();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWordBooks();
  }, [fetchWordBooks]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleStartRename = (book: { id: string; name: string }) => {
    setEditingId(book.id);
    setEditingName(book.name);
  };

  const handleConfirmRename = () => {
    if (editingId) {
      renameWordBook(editingId, editingName);
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const sortedBooks = [...wordBooks].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  const handleClear = () => {
    if (words.length > 0 && window.confirm('确定清空当前单词本的所有单词吗？')) {
      clearWords();
    }
  };

  const handleAddClick = (action: () => void) => {
    if (wordBooks.length === 0) {
      alert('请先添加单词本才能添加单词');
      return;
    }
    action();
  };

  const activeBookName = wordBooks.find(b => b.id === activeBookId)?.name || '未选择';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">单词听写</h1>
                <p className="text-xs text-gray-500">
                  {wordBooks.length > 0 ? `${activeBookName} (${words.length} 个单词)` : '暂无单词本'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/print')}
                className="p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                aria-label="打印/导出"
              >
                <FileText className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => onNavigate('/settings')}
                className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-colors shadow-lg shadow-blue-200"
                aria-label="听写设置"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Word Book Selector */}
          <div className="mt-4 bg-white/60 p-2 rounded-xl border border-gray-150 flex items-center gap-2 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap px-1">当前单词本:</span>
            <div ref={dropdownRef} className="relative flex-1">
              {wordBooks.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      setEditingId(null);
                    }}
                    className="w-full flex items-center justify-between bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer px-1 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="truncate">{activeBookName} ({words.length})</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {sortedBooks.map((book) => (
                          <div
                            key={book.id}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                              book.id === activeBookId ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                              if (editingId === book.id) return;
                              setActiveBookId(book.id);
                              setDropdownOpen(false);
                            }}
                          >
                            {editingId === book.id ? (
                              <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmRename();
                                    if (e.key === 'Escape') handleCancelRename();
                                  }}
                                  autoFocus
                                  className="flex-1 text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmRename();
                                  }}
                                  className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                                  title="确认"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelRename();
                                  }}
                                  className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                                  title="取消"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-800 truncate">{book.name}</div>
                                  <div className="text-xs text-gray-400">{book.words.length} 个单词</div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartRename(book);
                                  }}
                                  className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="重命名"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`确定删除单词本 "${book.name}" 吗？本内单词将全部清空。`)) {
                                      removeWordBook(book.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="flex-1 text-xs text-gray-400 px-1">请点击右侧按钮新建单词本</span>
              )}
            </div>
            
            <button
              onClick={() => {
                const name = prompt('请输入新单词本名称:');
                if (name && name.trim()) {
                  addWordBook(name);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
              title="新建单词本"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleAddClick(() => setIsCameraOpen(true))}
            className="flex-1 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">拍照识别</span>
          </button>
          <button
            onClick={() => handleAddClick(() => {
              setEditWord(null);
              setIsAddOpen(true);
            })}
            className="flex-1 py-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">手动添加</span>
          </button>
          <button
            onClick={() => handleAddClick(() => setIsBatchAddOpen(true))}
            className="flex-1 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Layers className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">批量添加</span>
          </button>
          <button
            onClick={handleClear}
            disabled={words.length === 0}
            className="px-3 py-3 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="清空"
          >
            <Trash2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => {
            if (words.length === 0) {
              alert('请先添加单词再开始听写');
              return;
            }
            const selectedCount = words.filter((w) => w.selected !== false).length;
            if (selectedCount === 0) {
              alert('请至少勾选一个单词进行听写');
              return;
            }
            onNavigate('/dictation');
          }}
          disabled={words.length === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mb-6"
        >
          <PlayCircle className="w-6 h-6" />
          开始听写
        </button>

        {/* Checkbox Control Bar */}
        {words.length > 0 && (
          <div className="flex items-center justify-between mb-4 bg-white/60 px-4 py-2.5 rounded-xl border border-gray-150 shadow-sm">
            <span className="text-xs text-gray-500 font-semibold">
              已选中 {words.filter((w) => w.selected !== false).length} / {words.length} 个单词
            </span>
            <div className="flex gap-4">
              <button
                onClick={() => toggleAllWordsSelection(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                全选
              </button>
              <button
                onClick={() => toggleAllWordsSelection(false)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        {wordBooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FolderPlus className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">先添加单词本才能添加单词</h3>
            <p className="text-sm text-gray-500">点击上方 ➕ 按钮创建你的第一个单词本</p>
          </div>
        ) : words.length > 0 ? (
          <div className="space-y-3">
            {words.map((word, index) => (
              <WordCard
                key={word.id}
                word={word}
                index={index + 1}
                onEdit={() => {
                  setEditWord(word);
                  setIsAddOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">还没有单词</h3>
            <p className="text-sm text-gray-500">点击上方按钮添加单词到 【{activeBookName}】</p>
          </div>
        )}
      </main>

      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} />
      <AddWordModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        editWord={editWord}
      />
      <BatchAddModal isOpen={isBatchAddOpen} onClose={() => setIsBatchAddOpen(false)} />
    </div>
  );
}