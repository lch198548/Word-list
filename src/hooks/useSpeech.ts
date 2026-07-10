import { useCallback, useRef } from 'react';

type Speed = 'slow' | 'medium' | 'fast';

const SPEED_MAP: Record<Speed, number> = {
  slow: 0.5,
  medium: 1,
  fast: 1.5,
};

export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, speed: Speed = 'medium', lang: string = 'en-US') => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = SPEED_MAP[speed];
    utterance.pitch = 1;
    utterance.volume = 1;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakEnglish = useCallback((text: string, speed: Speed = 'medium') => {
    speak(text, speed, 'en-US');
  }, [speak]);

  const speakChinese = useCallback((text: string, speed: Speed = 'medium') => {
    speak(text, speed, 'zh-CN');
  }, [speak]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return {
    speak,
    speakEnglish,
    speakChinese,
    stop,
  };
}