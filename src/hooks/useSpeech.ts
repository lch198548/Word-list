import { useCallback, useRef } from 'react';

type Speed = 'slow' | 'medium' | 'fast';

const SPEED_MAP: Record<Speed, number> = {
  slow: 2,
  medium: 3,
  fast: 4,
};

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.warn('Audio playback failed:', err);
    });
  }, []);

  const speakEnglish = useCallback((text: string, speed: Speed = 'medium') => {
    const encodedText = encodeURIComponent(text);
    const spd = SPEED_MAP[speed];
    const url = `https://fanyi.baidu.com/gettts?lan=en&text=${encodedText}&spd=${spd}&source=web`;
    playAudio(url);
  }, [playAudio]);

  const speakChinese = useCallback((text: string, speed: Speed = 'medium') => {
    const encodedText = encodeURIComponent(text);
    const spd = SPEED_MAP[speed];
    const url = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=${spd}&source=web`;
    playAudio(url);
  }, [playAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  return {
    speakEnglish,
    speakChinese,
    stop,
  };
}