export interface Word {
  id: string;
  english: string;
  chinese: string;
  pos: string;
  phonetic?: string;
  selected?: boolean;
  createdAt: number;
}

export interface WordBook {
  id: string;
  name: string;
  words: Word[];
  createdAt: number;
}

export interface DictationSettings {
  mode: 'chinese' | 'english';
  repeatCount: number;
  interval: number;
  speed: 'slow' | 'medium' | 'fast';
  type: 'online' | 'offline';
}

export interface DictationResult {
  word: Word;
  userAnswer: string;
  isCorrect: boolean;
}

export interface DictationState {
  currentIndex: number;
  results: DictationResult[];
  isPlaying: boolean;
  isFinished: boolean;
}