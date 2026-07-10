import { useState, useCallback, useRef, useEffect } from 'react';

export function useOCR() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('无法访问摄像头');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImageData(dataUrl);
    return dataUrl;
  }, []);

  const recognizeText = useCallback(async (imageDataUrl: string): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          apikey: 'K84641806088957',
          base64Image: imageDataUrl,
          language: 'eng',
        }),
      });

      const result = await response.json();
      
      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || 'OCR processing failed');
      }

      const parsedText = result.ParsedResults?.[0]?.ParsedText || '';
      const words = parsedText
        .split(/[\s\n,.;:!?()'"<>]+/)
        .filter((word: string) => word.length > 1 && /^[a-zA-Z]+$/.test(word))
        .map((word: string) => word.toLowerCase());

      return [...new Set<string>(words)];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    loading,
    error,
    imageData,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    recognizeText,
  };
}