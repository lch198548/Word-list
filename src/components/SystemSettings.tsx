import { useState } from 'react';
import { Key, Eye, HelpCircle, Save, Loader2, RefreshCw } from 'lucide-react';
import { useWordStore } from '../stores/wordStore';

export function SystemSettings() {
  const { config, updateSystemConfig, changePassword } = useWordStore();

  // Config States
  const [baiduAppId, setBaiduAppId] = useState(config.baiduAppId);
  const [baiduKey, setBaiduKey] = useState(config.baiduKey);
  const [exportDelimiter, setExportDelimiter] = useState(config.exportDelimiter);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);

    // Dynamic delay for feedback feel
    await new Promise((resolve) => setTimeout(resolve, 500));
    await updateSystemConfig({
      baiduAppId: baiduAppId.trim(),
      baiduKey: baiduKey.trim(),
      exportDelimiter,
    });

    setSaveLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError('所有字段均为必填项');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 3) {
      setPassError('密码长度不能少于3位');
      return;
    }

    setPassLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    setPassLoading(false);

    if (result.success) {
      setPassSuccess('密码修改成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassError(result.error || '旧密码验证失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-500" />
          API 与默认导出设置
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            百度翻译 APP ID
            <span className="text-xs text-gray-400 font-normal">(用于获取单词翻译)</span>
          </label>
          <input
            type="text"
            value={baiduAppId}
            onChange={(e) => setBaiduAppId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
            placeholder="请输入百度翻译 APP ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            百度翻译密钥 (Security Key)
          </label>
          <input
            type="password"
            value={baiduKey}
            onChange={(e) => setBaiduKey(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
            placeholder="请输入百度翻译密钥"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>默认导出分隔符</span>
            <span className="text-xs text-gray-400">目前长度: {exportDelimiter.length} 个字符</span>
          </label>
          <input
            type="text"
            value={exportDelimiter}
            onChange={(e) => setExportDelimiter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
            placeholder="默认 8 个空格"
          />
        </div>

        <button
          type="submit"
          disabled={saveLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saveLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saveSuccess ? (
            '保存成功 ✔'
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存系统配置
            </>
          )}
        </button>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-500" />
          修改进入密码
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            当前密码
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50/50"
            placeholder="请输入当前的登录密码"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新密码
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50/50"
            placeholder="请输入新密码 (最少 3 位)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            确认新密码
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50/50"
            placeholder="请再次输入新密码"
          />
        </div>

        {passError && (
          <p className="text-red-500 text-xs font-medium animate-pulse">
            ⚠️ {passError}
          </p>
        )}

        {passSuccess && (
          <p className="text-green-600 text-xs font-semibold">
            🎉 {passSuccess}
          </p>
        )}

        <button
          type="submit"
          disabled={passLoading}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {passLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              修改并保存密码
            </>
          )}
        </button>
      </form>
    </div>
  );
}
