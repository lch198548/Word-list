import { useEffect, useRef, useState } from 'react';
import { useWordStore } from '@/stores/wordStore';
import { useDictionary } from '@/hooks/useDictionary';

/**
 * 登录并加载词库后，后台扫描当前词本所有缺音标的单词，
 * 顺序补齐（含节流与进度指示）并写回 store（落库服务器）。
 * 这样旧数据也会自动补上音标并持久化。
 */
export function AutoBackfill() {
  const { isAuthenticated } = useWordStore();
  const { fetchPhonetics } = useDictionary();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (runningRef.current) return;

    let cancelled = false;
    const run = async () => {
      const all = useWordStore.getState().words;
      const missing = all.filter((w) => !w.phonetic && !w.phoneticUK);
      if (missing.length === 0) return;
      runningRef.current = true;
      let done = 0;
      setProgress({ done, total: missing.length });
      for (const w of missing) {
        if (cancelled) break;
        try {
          const info = await fetchPhonetics(w.english);
          if (info.phonetic || info.phoneticUK || info.pos) {
            useWordStore.getState().updateWord(w.id, info);
          }
        } catch {
          // 单个失败不影响整体，继续下一个
        }
        done += 1;
        setProgress({ done, total: missing.length });
        await new Promise((r) => setTimeout(r, 250));
      }
      setProgress(null);
      runningRef.current = false;
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchPhonetics]);

  if (!progress) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      正在补全音标 {progress.done}/{progress.total}
    </div>
  );
}
