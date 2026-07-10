import { useState } from 'react';
import { Printer, Download, RotateCcw, FileText, FileCheck } from 'lucide-react';
import { Word } from '../types';
import { useWordStore } from '../stores/wordStore';

interface PrintPreviewProps {
  words: Word[];
  onBack: () => void;
}

type PrintMode = 'chinese' | 'english';

export function PrintPreview({ words, onBack }: PrintPreviewProps) {
  const { config } = useWordStore();
  const [printMode, setPrintMode] = useState<PrintMode>('chinese');

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const content = words
      .map((w) => `${w.english}${config.exportDelimiter}${w.pos || ''}${config.exportDelimiter}${w.chinese || ''}`)
      .join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'words.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">打印与导出</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出TXT
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              打印
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setPrintMode('chinese')}
            className={`flex-1 py-2 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              printMode === 'chinese'
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            打印中文
          </button>
          <button
            onClick={() => setPrintMode('english')}
            className={`flex-1 py-2 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              printMode === 'english'
                ? 'border-green-500 bg-green-50 text-green-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            打印英文
          </button>
        </div>

        <div className="bg-white p-8 shadow-inner border border-gray-200 rounded-lg" id="print-area">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {printMode === 'chinese' ? '英语单词听写练习' : '答案纸'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">共 {words.length} 个单词</p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {words.map((word, index) => (
              <div key={word.id} className="flex items-start gap-3">
                <span className="w-6 text-sm text-gray-400 flex-shrink-0">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  {printMode === 'chinese' ? (
                    <>
                      <div className="text-base font-medium text-gray-800">{word.chinese}</div>
                      <div className="border-b border-gray-300 mt-3 w-full" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{word.english}</span>
                        {word.pos && (
                          <span className="text-xs text-gray-500">({word.pos})</span>
                        )}
                      </div>
                      <div className="border-b border-gray-300 mt-2 w-full" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {words.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>暂无单词，请先添加单词</p>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-5 h-5" />
        返回首页
      </button>
    </div>
  );
}