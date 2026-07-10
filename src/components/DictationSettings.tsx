import { Play, Volume2, Timer, Repeat } from 'lucide-react';
import { useWordStore } from '../stores/wordStore';

export function DictationSettings() {
  const { settings, updateSettings, words } = useWordStore();

  const speedOptions = [
    { value: 'slow', label: '慢速', icon: '🐢' },
    { value: 'medium', label: '中速', icon: '🐇' },
    { value: 'fast', label: '快速', icon: '🚀' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-500" />
          听写模式
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateSettings({ mode: 'chinese' })}
            className={`p-4 rounded-xl border-2 transition-all ${
              settings.mode === 'chinese'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">📖</div>
            <div className="font-medium text-gray-800">报中文模式</div>
            <div className="text-xs text-gray-500 mt-1">听中文写英文</div>
          </button>
          <button
            onClick={() => updateSettings({ mode: 'english' })}
            className={`p-4 rounded-xl border-2 transition-all ${
              settings.mode === 'english'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">🔊</div>
            <div className="font-medium text-gray-800">报英文模式</div>
            <div className="text-xs text-gray-500 mt-1">听英文写中文</div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-500" />
          答题方式
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateSettings({ type: 'online' })}
            className={`p-4 rounded-xl border-2 transition-all ${
              settings.type === 'online'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">💻</div>
            <div className="font-medium text-gray-800">线上听写</div>
            <div className="text-xs text-gray-500 mt-1">在页面中输入答案</div>
          </button>
          <button
            onClick={() => updateSettings({ type: 'offline' })}
            className={`p-4 rounded-xl border-2 transition-all ${
              settings.type === 'offline'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-800">线下听写</div>
            <div className="text-xs text-gray-500 mt-1">纸笔听写，完成后对答案</div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-blue-500" />
          播报次数
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={settings.repeatCount}
            onChange={(e) => updateSettings({ repeatCount: parseInt(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-lg font-semibold text-blue-600 w-8 text-center">
            {settings.repeatCount}
          </span>
          <span className="text-sm text-gray-500">次</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>1次</span>
          <span>5次</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-blue-500" />
          间隔时间
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="10"
            value={settings.interval}
            onChange={(e) => updateSettings({ interval: parseInt(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-lg font-semibold text-blue-600 w-8 text-center">
            {settings.interval}
          </span>
          <span className="text-sm text-gray-500">秒</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>1秒</span>
          <span>10秒</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-500" />
          语速设置
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {speedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateSettings({ speed: option.value as 'slow' | 'medium' | 'fast' })}
              className={`p-3 rounded-xl border-2 transition-all ${
                settings.speed === option.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">{option.icon}</div>
              <div className="text-sm font-medium text-gray-800">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {words.length === 0 && (
        <p className="text-center text-gray-500 text-sm">请先添加单词再开始听写</p>
      )}
    </div>
  );
}