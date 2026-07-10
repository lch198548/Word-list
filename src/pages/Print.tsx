import { ArrowLeft, Printer } from 'lucide-react';
import { PrintPreview } from '../components/PrintPreview';
import { useWordStore } from '../stores/wordStore';

interface PrintProps {
  onNavigate: (path: string) => void;
}

export default function Print({ onNavigate }: PrintProps) {
  const { words } = useWordStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">打印预览</h1>
                <p className="text-xs text-gray-500">{words.length} 个单词</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <PrintPreview words={words} onBack={() => onNavigate('/')} />
      </main>
    </div>
  );
}