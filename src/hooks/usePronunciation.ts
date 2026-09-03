import { useCallback } from 'react';
import { useSpeech } from './useSpeech';

export type Accent = 'us' | 'uk';
export type SpeechSpeed = 'slow' | 'normal' | 'medium' | 'fast';

const SPEED_TO_TTS: Record<SpeechSpeed, 'slow' | 'medium' | 'fast'> = {
  slow: 'slow',
  normal: 'medium',
  medium: 'medium',
  fast: 'fast',
};

export function usePronunciation() {
  const { speakEnglish } = useSpeech();
  const speak = useCallback(
    (text: string, _accent: Accent, speed: SpeechSpeed) => {
      speakEnglish(text, SPEED_TO_TTS[speed]);
    },
    [speakEnglish],
  );
  return { speak };
}
