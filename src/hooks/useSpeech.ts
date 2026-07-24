import { useCallback, useRef } from 'react';

type Speed = 'slow' | 'medium' | 'fast';

const SPEED_MAP: Record<Speed, number> = {
  slow: 2,
  medium: 3,
  fast: 4,
};

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        
        const audio = new Audio(blobUrl);
        audioRef.current = audio;
        
        audio.play().catch((err) => {
          console.warn('Audio playback failed:', err);
        });

        audio.onended = () => {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }
          audioRef.current = null;
        };
      })
      .catch(err => {
        console.warn('Failed to fetch audio:', err);
      });
  }, []);

  const speakEnglish = useCallback((text: string, speed: Speed = 'medium') => {
    const encodedText = encodeURIComponent(text);
    const spd = SPEED_MAP[speed];
    const url = `/api/baidu-tts?lan=en&text=${encodedText}&spd=${spd}`;
    playAudio(url);
  }, [playAudio]);

  const speakChinese = useCallback((text: string, speed: Speed = 'medium') => {
    const encodedText = encodeURIComponent(text);
    const spd = SPEED_MAP[speed];
    const url = `/api/baidu-tts?lan=zh&text=${encodedText}&spd=${spd}`;
    playAudio(url);
  }, [playAudio]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  return {
    speakEnglish,
    speakChinese,
    stop,
  };
}