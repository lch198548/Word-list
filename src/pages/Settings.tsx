import { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { DictationSettings } from '../components/DictationSettings';
import { SystemSettings } from '../components/SystemSettings';
import { useWordStore } from '../stores/wordStore';

interface SettingsProps {
  onNavigate: (path: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const { words } = useWordStore();
  const [activeTab, setActiveTab] = useState<'dictation' | 'system'>('dictation');

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {activeTab === 'dictation' ? '听写设置' : '系统设置'}
                </h1>
                <p className="text-xs text-gray-500">
                  {activeTab === 'dictation' ? `${words.length} 个单词待听写` : '配置您的后台服务'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Tab Selector */}
        <div className="flex bg-white/60 p-1 rounded-2xl border border-gray-150 mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('dictation')}
            className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'dictation'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            听写参数
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'system'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            系统与密钥
          </button>
        </div>

        {activeTab === 'dictation' ? (
          <DictationSettings />
        ) : (
          <SystemSettings />
        )}
      </main>
    </div>
  );
}