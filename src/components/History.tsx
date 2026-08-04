import React, { useState } from 'react';
import { Eye, Trash2, Download, FileText, FileImage, X, Clock, Calendar } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HistoryProps {
  onClose?: () => void;
}

export const History: React.FC<HistoryProps> = ({ onClose }) => {
  const { history, clearHistory, t } = useSettings();
  const [activeTab, setActiveTab] = useState<'view' | 'delete' | 'export' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleDelete = () => {
    clearHistory();
    setShowDeleteConfirm(false);
    setSnackbarMessage(t('historyDeleted'));
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleExport = (format: 'pdf' | 'txt') => {
    let content = `${t('history')}\n\n`;
    history.forEach((item, index) => {
      content += `${item.expression} = ${item.result}\n`;
      content += `${item.date}\n`;
      content += `${item.time}\n\n`;
    });

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calculator_history.txt';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Simple PDF export using window.print with styled content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${t('history')}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                .entry { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .expression { font-size: 18px; font-weight: bold; color: #333; }
                .result { font-size: 16px; color: #666; margin-top: 5px; }
                .meta { font-size: 14px; color: #999; margin-top: 5px; }
              </style>
            </head>
            <body>
              <h1>${t('history')}</h1>
              ${history.map(item => `
                <div class="entry">
                  <div class="expression">${item.expression} = ${item.result}</div>
                  <div class="meta">${item.date} | ${item.time}</div>
                </div>
              `).join('')}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }

    setShowExportSheet(false);
    setSnackbarMessage(t('historyExported'));
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const renderViewHistory = () => (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mb-4">
            <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('noHistory')}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                    {item.expression} = {item.result}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{item.date}</span>
                    <span className="mx-1">•</span>
                    <Clock className="w-4 h-4" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDeleteHistory = () => (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-800">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
              {t('deleteConfirmTitle')}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {t('deleteConfirmMessage')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderExportHistory = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
          {t('exportHistory')}
        </h3>
        <div className="space-y-3">
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-4 py-4 rounded-xl bg-white dark:bg-[#2a2a2a] flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors border border-gray-200 dark:border-gray-600"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-blue-600 shadow-lg">
              <FileImage className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800 dark:text-white">{t('exportAsPdf')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Export as PDF document</p>
            </div>
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="w-full px-4 py-4 rounded-xl bg-white dark:bg-[#2a2a2a] flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors border border-gray-200 dark:border-gray-600"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800 dark:text-white">{t('exportAsTxt')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Export as text file</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0d0d0d] transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-[#1a1a1a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('history')}</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {activeTab === null ? (
          <div className="grid grid-cols-1 gap-4">
            {/* View History Card */}
            <button
              onClick={() => setActiveTab('view')}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t('viewHistory')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {history.length} {history.length === 1 ? 'calculation' : 'calculations'}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-gray-100 dark:bg-[#333333]">
                  <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </button>

            {/* Delete History Card */}
            <button
              onClick={() => setActiveTab('delete')}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-blue-600 shadow-lg">
                  <Trash2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t('deleteHistory')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Permanently remove all calculations
                  </p>
                </div>
                <div className="p-2 rounded-full bg-gray-100 dark:bg-[#333333]">
                  <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </button>

            {/* Export History Card */}
            <button
              onClick={() => setActiveTab('export')}
              className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {t('exportHistory')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Download as PDF or TXT
                  </p>
                </div>
                <div className="p-2 rounded-full bg-gray-100 dark:bg-[#333333]">
                  <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
            >
              <X className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            {activeTab === 'view' && renderViewHistory()}
            {activeTab === 'delete' && renderDeleteHistory()}
            {activeTab === 'export' && renderExportHistory()}
          </div>
        )}
      </div>

      {/* Snackbar */}
      {showSnackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">{snackbarMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
