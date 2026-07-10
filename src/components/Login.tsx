import { useState } from 'react';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { useWordStore } from '../stores/wordStore';

export function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useWordStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('请输入密码');
      return;
    }
    setError('');
    setLoading(true);
    
    // Slight artificial delay for premium micro-interaction feeling
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const success = await login(password);
    setLoading(false);
    if (!success) {
      setError('密码错误，请重新输入');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-100 to-blue-100 p-4">
      <div className="bg-white/80 backdrop-blur-lg border border-white/50 rounded-3xl w-full max-w-md p-8 shadow-2xl shadow-slate-200/50 flex flex-col items-center">
        {/* Animated Icon Circle */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200/50 mb-6 animate-bounce">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">单词听写系统</h2>
        <p className="text-sm text-slate-500 mb-8 text-center">
          请输入访问密码以解锁您的单词账本
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入访问密码..."
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 transition-all text-center text-lg tracking-widest placeholder:tracking-normal font-semibold text-slate-800"
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 text-center font-medium animate-pulse">
                ⚠️ {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                验证密码
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        <p className="text-[10px] text-slate-400 mt-8">
          默认密码为 123 • 数据已存入服务器
        </p>
      </div>
    </div>
  );
}
