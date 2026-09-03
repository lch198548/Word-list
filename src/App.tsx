import { useState, useEffect } from 'react';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import Dictation from '@/pages/Dictation';
import Print from '@/pages/Print';
import Learn from '@/pages/Learn';
import { Login } from '@/components/Login';
import { AutoBackfill } from '@/components/AutoBackfill';
import { useWordStore } from '@/stores/wordStore';

type Page = 'home' | 'settings' | 'dictation' | 'print' | 'learn';

const HASH_TO_PAGE: Record<string, Page> = {
  '': 'home',
  '#home': 'home',
  '#settings': 'settings',
  '#dictation': 'dictation',
  '#learn': 'learn',
  '#print': 'print',
};
const PAGE_TO_HASH: Record<Page, string> = {
  home: '#home',
  settings: '#settings',
  dictation: '#dictation',
  learn: '#learn',
  print: '#print',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(
    () => HASH_TO_PAGE[window.location.hash] ?? 'home',
  );
  const { isAuthenticated, fetchConfig, fetchWordBooks } = useWordStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig();
      fetchWordBooks();
    }
  }, [isAuthenticated, fetchConfig, fetchWordBooks]);

  // 安卓 WebView 返回键：用浏览器历史栈承接，避免直接退出 App
  useEffect(() => {
    const onPop = () => setCurrentPage(HASH_TO_PAGE[window.location.hash] ?? 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleNavigate = (path: string) => {
    const page = HASH_TO_PAGE['#' + path.replace(/^\//, '')] ?? 'home';
    setCurrentPage(page);
    window.history.pushState({ page }, '', PAGE_TO_HASH[page]);
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'settings' && <Settings onNavigate={handleNavigate} />}
      {currentPage === 'dictation' && <Dictation onNavigate={handleNavigate} />}
      {currentPage === 'learn' && <Learn onNavigate={handleNavigate} />}
      {currentPage === 'print' && <Print onNavigate={handleNavigate} />}
      <AutoBackfill />
    </div>
  );
}
