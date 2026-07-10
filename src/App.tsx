import { useState, useEffect } from 'react';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import Dictation from '@/pages/Dictation';
import Print from '@/pages/Print';
import { Login } from '@/components/Login';
import { useWordStore } from '@/stores/wordStore';

type Page = 'home' | 'settings' | 'dictation' | 'print';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { isAuthenticated, fetchConfig, fetchWordBooks } = useWordStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig();
      fetchWordBooks();
    }
  }, [isAuthenticated, fetchConfig, fetchWordBooks]);

  const handleNavigate = (path: string) => {
    switch (path) {
      case '/':
        setCurrentPage('home');
        break;
      case '/settings':
        setCurrentPage('settings');
        break;
      case '/dictation':
        setCurrentPage('dictation');
        break;
      case '/print':
        setCurrentPage('print');
        break;
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'settings' && (
        <Settings onNavigate={handleNavigate} />
      )}
      {currentPage === 'dictation' && <Dictation onNavigate={handleNavigate} />}
      {currentPage === 'print' && <Print onNavigate={handleNavigate} />}
    </div>
  );
}