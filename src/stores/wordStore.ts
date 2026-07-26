import { create } from 'zustand';
import { Word, DictationSettings, WordBook } from '../types';

interface SystemConfig {
  baiduAppId: string;
  baiduKey: string;
  exportDelimiter: string;
}

interface WordStore {
  // Authentication
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  
  // Config & Settings
  config: SystemConfig;
  updateSystemConfig: (updates: Partial<SystemConfig>) => Promise<void>;
  fetchConfig: () => Promise<void>;

  // Data
  wordBooks: WordBook[];
  activeBookId: string | null;
  words: Word[];
  settings: DictationSettings;
  
  // Word Book actions
  addWordBook: (name: string) => void;
  removeWordBook: (id: string) => void;
  setActiveBookId: (id: string | null) => void;
  renameWordBook: (id: string, newName: string) => void;
  fetchWordBooks: () => Promise<void>;
  
  // Word actions (now scoped to active word book)
  addWord: (word: Word) => void;
  addWords: (words: Word[]) => void;
  updateWord: (id: string, updates: Partial<Word>) => void;
  removeWord: (id: string) => void;
  clearWords: () => void;
  toggleAllWordsSelection: (selected: boolean) => void;
  
  // Dictation Settings
  updateSettings: (settings: Partial<DictationSettings>) => void;
  getWordsForDictation: () => Word[];
}

const defaultSettings: DictationSettings = {
  mode: 'chinese',
  repeatCount: 2,
  interval: 3,
  speed: 'medium',
  type: 'online',
};

const defaultConfig: SystemConfig = {
  baiduAppId: '20240607002071839',
  baiduKey: 'EER6yOohPC_NtHszZs2G',
  exportDelimiter: '        ',
};

const saveWordBooksToServer = async (books: WordBook[]) => {
  try {
    await fetch('/api/wordbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(books),
    });
  } catch (err) {
    console.warn('Failed to save wordbooks to server:', err);
  }
};

const STORAGE_KEY = 'word-dictation-auth';

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

const setStoredAuth = (value: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, value.toString());
  } catch {}
};

export const useWordStore = create<WordStore>((set, get) => ({
  isAuthenticated: getStoredAuth(),
  config: defaultConfig,
  wordBooks: [],
  activeBookId: null,
  words: [],
  settings: defaultSettings,

  login: async (password: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        set({ isAuthenticated: true });
        setStoredAuth(true);
        await get().fetchConfig();
        await get().fetchWordBooks();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.error || '修改密码失败' };
    } catch (err) {
      return { success: false, error: '网络错误，请稍后再试' };
    }
  },

  fetchConfig: async () => {
    try {
      const res = await fetch(`/api/config?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          config: {
            baiduAppId: data.baiduAppId || defaultConfig.baiduAppId,
            baiduKey: data.baiduKey || defaultConfig.baiduKey,
            exportDelimiter: data.exportDelimiter || defaultConfig.exportDelimiter,
          },
          settings: data.dictationSettings
            ? { ...state.settings, ...data.dictationSettings }
            : state.settings,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch config from server:', err);
    }
  },

  updateSystemConfig: async (updates) => {
    try {
      const newConfig = { ...get().config, ...updates };
      set({ config: newConfig });
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Failed to update config on server:', err);
    }
  },

  addWordBook: (name) => set((state) => {
    if (state.wordBooks.length >= 100) {
      alert('单词本数量已达上限（最大100个）');
      return {};
    }
    const newBook: WordBook = {
      id: Date.now().toString() + Math.random(),
      name: name.trim(),
      words: [],
      createdAt: Date.now(),
    };
    const updatedBooks = [...state.wordBooks, newBook];
    saveWordBooksToServer(updatedBooks);
    
    const newActiveId = state.activeBookId || newBook.id;
    const activeBook = updatedBooks.find(b => b.id === newActiveId);
    
    return {
      wordBooks: updatedBooks,
      activeBookId: newActiveId,
      words: activeBook ? activeBook.words : [],
    };
  }),

  removeWordBook: (id) => set((state) => {
    const updatedBooks = state.wordBooks.filter((b) => b.id !== id);
    saveWordBooksToServer(updatedBooks);
    
    let newActiveId = state.activeBookId;
    if (newActiveId === id) {
      newActiveId = updatedBooks.length > 0 ? updatedBooks[0].id : null;
    }
    const activeBook = updatedBooks.find(b => b.id === newActiveId);
    
    return {
      wordBooks: updatedBooks,
      activeBookId: newActiveId,
      words: activeBook ? activeBook.words : [],
    };
  }),

  setActiveBookId: (id) => set((state) => {
    const activeBook = state.wordBooks.find((b) => b.id === id);
    return {
      activeBookId: id,
      words: activeBook ? activeBook.words : [],
    };
  }),

  renameWordBook: (id, newName) => set((state) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert('单词本名称不能为空');
      return {};
    }
    const updatedBooks = state.wordBooks.map((b) =>
      b.id === id ? { ...b, name: trimmedName } : b
    );
    saveWordBooksToServer(updatedBooks);
    const activeBook = updatedBooks.find((b) => b.id === state.activeBookId);
    return {
      wordBooks: updatedBooks,
      words: activeBook ? activeBook.words : [],
    };
  }),

  fetchWordBooks: async () => {
    try {
      const res = await fetch(`/api/wordbooks?t=${Date.now()}`);
      if (res.ok) {
        const books = await res.json();
        if (Array.isArray(books)) {
          set((state) => {
            let newActiveId = state.activeBookId;
            if (!newActiveId && books.length > 0) {
              newActiveId = books[0].id;
            } else if (newActiveId && !books.some((b) => b.id === newActiveId)) {
              newActiveId = books.length > 0 ? books[0].id : null;
            }
            const activeBook = books.find((b) => b.id === newActiveId);
            return {
              wordBooks: books,
              activeBookId: newActiveId,
              words: activeBook ? activeBook.words : [],
            };
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch wordbooks from server:', err);
    }
  },

  addWord: (word) => set((state) => {
    if (!state.activeBookId) {
      alert('请先选择或创建一个单词本');
      return {};
    }
    const book = state.wordBooks.find((b) => b.id === state.activeBookId);
    if (book && book.words.length >= 100) {
      alert('当前单词本的单词数量已达上限（最大100个）');
      return {};
    }
    const updatedBooks = state.wordBooks.map((b) =>
      b.id === state.activeBookId ? { ...b, words: [...b.words, word] } : b
    );
    saveWordBooksToServer(updatedBooks);
    return {
      wordBooks: updatedBooks,
      words: updatedBooks.find((b) => b.id === state.activeBookId)?.words || [],
    };
  }),

  addWords: (newWords) => set((state) => {
    if (!state.activeBookId) {
      alert('请先选择或创建一个单词本');
      return {};
    }
    const book = state.wordBooks.find((b) => b.id === state.activeBookId);
    if (!book) return {};

    const currentCount = book.words.length;
    if (currentCount >= 100) {
      alert('当前单词本的单词数量已达上限（最大100个）');
      return {};
    }

    const allowedCount = 100 - currentCount;
    let wordsToAdd = newWords;
    if (newWords.length > allowedCount) {
      alert(`当前单词本最多还能添加 ${allowedCount} 个单词，超出部分将被忽略`);
      wordsToAdd = newWords.slice(0, allowedCount);
    }

    const updatedBooks = state.wordBooks.map((b) =>
      b.id === state.activeBookId ? { ...b, words: [...b.words, ...wordsToAdd] } : b
    );
    saveWordBooksToServer(updatedBooks);
    return {
      wordBooks: updatedBooks,
      words: updatedBooks.find((b) => b.id === state.activeBookId)?.words || [],
    };
  }),

  updateWord: (id, updates) => set((state) => {
    if (!state.activeBookId) return {};
    const updatedBooks = state.wordBooks.map((b) => {
      if (b.id === state.activeBookId) {
        return {
          ...b,
          words: b.words.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        };
      }
      return b;
    });
    saveWordBooksToServer(updatedBooks);
    return {
      wordBooks: updatedBooks,
      words: updatedBooks.find((b) => b.id === state.activeBookId)?.words || [],
    };
  }),

  removeWord: (id) => set((state) => {
    if (!state.activeBookId) return {};
    const updatedBooks = state.wordBooks.map((b) => {
      if (b.id === state.activeBookId) {
        return {
          ...b,
          words: b.words.filter((w) => w.id !== id),
        };
      }
      return b;
    });
    saveWordBooksToServer(updatedBooks);
    return {
      wordBooks: updatedBooks,
      words: updatedBooks.find((b) => b.id === state.activeBookId)?.words || [],
    };
  }),

  clearWords: () => set((state) => {
    if (!state.activeBookId) return {};
    const updatedBooks = state.wordBooks.map((b) =>
      b.id === state.activeBookId ? { ...b, words: [] } : b
    );
    saveWordBooksToServer(updatedBooks);
    return {
      wordBooks: updatedBooks,
      words: [],
    };
  }),

  toggleAllWordsSelection: (selected) => set((state) => {
    if (!state.activeBookId) return {};
    const updatedBooks = state.wordBooks.map((b) => {
      if (b.id === state.activeBookId) {
        return {
          ...b,
          words: b.words.map((w) => ({ ...w, selected })),
        };
      }
      return b;
    });
    saveWordBooksToServer(updatedBooks);
    return {
      wordBooks: updatedBooks,
      words: updatedBooks.find((b) => b.id === state.activeBookId)?.words || [],
    };
  }),

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dictationSettings: updated }),
      }).catch((err) => console.warn('Failed to save settings to server:', err));
      return { settings: updated };
    });
  },

  getWordsForDictation: () => {
    const words = get().words;
    const selectedWords = words.filter((w) => w.selected !== false);
    return [...selectedWords].sort(() => Math.random() - 0.5);
  },
}));