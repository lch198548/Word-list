import { useState, useEffect } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { useOCR } from '../hooks/useOCR';
import { useDictionary } from '../hooks/useDictionary';
import { useWordStore } from '../stores/wordStore';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CameraModal({ isOpen, onClose }: CameraModalProps) {
  const { videoRef, startCamera, stopCamera, captureImage, recognizeText, loading, error } = useOCR();
  const { createWord } = useDictionary();
  const { addWords } = useWordStore();
  const [captured, setCaptured] = useState(false);
  const [recognizedWords, setRecognizedWords] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setCaptured(false);
      setRecognizedWords([]);
    }
  }, [isOpen, startCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleCapture = async () => {
    const imageData = captureImage();
    if (imageData) {
      setCaptured(true);
      setProcessing(true);
      const words = await recognizeText(imageData);
      setRecognizedWords(words);
      setProcessing(false);
    }
  };

  const handleAddWords = async () => {
    if (recognizedWords.length === 0) return;
    
    setProcessing(true);
    const newWords = await Promise.all(
      recognizedWords.map((word) => createWord(word))
    );
    addWords(newWords);
    setProcessing(false);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        <div className="relative h-72 bg-black">
          {!captured ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Loader2 className={`w-8 h-8 mx-auto mb-2 animate-spin ${processing ? '' : 'hidden'}`} />
                <p className="text-sm">{processing ? '处理中...' : '识别完成'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {recognizedWords.length > 0 && !processing && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">识别到的单词:</p>
              <div className="flex flex-wrap gap-2">
                {recognizedWords.map((word) => (
                  <span
                    key={word}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!captured ? (
              <button
                onClick={handleCapture}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                拍照识别
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCaptured(false);
                    setRecognizedWords([]);
                    startCamera();
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  重新拍照
                </button>
                <button
                  onClick={handleAddWords}
                  disabled={processing || recognizedWords.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加单词
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}