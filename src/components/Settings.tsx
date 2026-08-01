import React, { useState } from 'react';
import { Moon, Sun, History, Globe, ChevronRight, X, Eye, Trash2, Download, Calendar, Clock, Lock, Shield, LogOut } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useVault } from '../context/VaultContext';

interface SettingsProps {
  onClose?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { settings, updateSettings, t, history, clearHistory } = useSettings();
  const { 
    settings: vaultSettings, 
    unlockVault, 
    setActiveTab, 
    setActiveContactId,
    updateSettings: updateVaultSettings,
    signOutGoogle,
    authUser,
    lockVault
  } = useVault();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isFirstTimeUser = !vaultSettings.passcode;

  const handleSecurityUnlock = () => {
    if (isFirstTimeUser) {
      // Setup new password
      if (securityPassword.length >= 4) {
        updateVaultSettings({ passcode: securityPassword });
        setSnackbarMessage('Password set successfully');
        setShowSnackbar(true);
        setShowSecurityModal(false);
        setSecurityPassword('');
        setTimeout(() => setShowSnackbar(false), 3000);
      } else {
        setSnackbarMessage('Password must be at least 4 digits');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
      }
    } else {
      // Unlock with existing password
      if (securityPassword === vaultSettings.passcode) {
        unlockVault(vaultSettings.passcode);
        setActiveTab('chats');
        setActiveContactId(null);
        setShowSecurityModal(false);
        setSecurityPassword('');
        onClose?.();
      } else {
        setShowSecurityModal(false);
        setSecurityPassword('');
        lockVault();
        onClose?.();
      }
    }
  };

  const handleDelete = () => {
    clearHistory();
    setShowDeleteConfirm(false);
    setSnackbarMessage(t('historyDeleted'));
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  const handleExport = (format: 'pdf' | 'txt') => {
    if (history.length === 0) return;

    let content = '';
    if (format === 'txt') {
      content = history.map(item => `${item.expression} = ${item.result}\nDate: ${item.date} Time: ${item.time}\n`).join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calculator_history.txt';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Calculator History</title></head>
            <body>
              <h1>Calculator History</h1>
              ${history.map(item => `<p><strong>${item.expression} = ${item.result}</strong><br>Date: ${item.date} Time: ${item.time}</p>`).join('')}
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

  const languages = [
    { code: 'en', name: t('english') },
    { code: 'hi', name: t('hindi') },
    { code: 'mr', name: t('marathi') },
    { code: 'pa', name: t('punjabi') },
    { code: 'gu', name: t('gujarati') },
    { code: 'ta', name: t('tamil') },
    { code: 'te', name: t('telugu') },
    { code: 'bn', name: t('bengali') },
    { code: 'kn', name: t('kannada') },
    { code: 'ml', name: t('malayalam') },
    { code: 'ur', name: t('urdu') },
  ];

  const handleLanguageSelect = (langCode: string) => {
    updateSettings('language', langCode);
    setShowLanguageModal(false);
  };

  const isDark = settings.darkMode;

  return (
    <div className={`w-full h-full flex flex-col transition-colors duration-300 ${
      isDark ? 'dark bg-[#121212] text-[#e9edef]' : 'bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 shadow-sm border-b transition-colors ${
        isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings')}</h1>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-[#2c2c2c] text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Appearance Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-5 py-3 border-b transition-colors ${
            isDark ? 'bg-[#252525] border-[#2d2d2d]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {t('appearance')}
            </h2>
          </div>

          {/* Dark Mode Toggle */}
          <div className={`px-5 py-4 flex items-center justify-between transition-colors ${
            isDark ? 'hover:bg-[#282828]' : 'hover:bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                {isDark ? (
                  <Moon className="w-5 h-5 text-white" />
                ) : (
                  <Sun className="w-5 h-5 text-white" />
                )}
              </div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('darkMode')}</span>
            </div>
            <button
              onClick={() => updateSettings('darkMode', !settings.darkMode)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                isDark ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  isDark ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* History Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-5 py-3 border-b transition-colors ${
            isDark ? 'bg-[#252525] border-[#2d2d2d]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {t('history')}
            </h2>
          </div>

          {/* Save History Toggle */}
          <div className={`px-5 py-4 flex items-center justify-between transition-colors ${
            isDark ? 'hover:bg-[#282828]' : 'hover:bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <History className="w-5 h-5 text-white" />
              </div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('saveHistory')}</span>
            </div>
            <button
              onClick={() => updateSettings('saveHistory', !settings.saveHistory)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings.saveHistory ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  settings.saveHistory ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* View History */}
          <button
            onClick={() => setShowHistoryView(true)}
            className={`w-full px-5 py-4 flex items-center justify-between transition-colors border-t ${
              isDark ? 'hover:bg-[#282828] border-[#2d2d2d]' : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('viewHistory')}</span>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{history.length} {history.length === 1 ? 'calculation' : 'calculations'}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>

          {/* Delete History */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`w-full px-5 py-4 flex items-center justify-between transition-colors border-t ${
              isDark ? 'hover:bg-[#282828] border-[#2d2d2d]' : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('deleteHistory')}</span>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>

          {/* Export History */}
          <button
            onClick={() => setShowExportSheet(true)}
            className={`w-full px-5 py-4 flex items-center justify-between transition-colors border-t ${
              isDark ? 'hover:bg-[#282828] border-[#2d2d2d]' : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('exportHistory')}</span>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Security Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-5 py-3 border-b transition-colors ${
            isDark ? 'bg-[#252525] border-[#2d2d2d]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Security
            </h2>
          </div>

          {/* Vault Settings */}
          <button
            onClick={() => setShowSecurityModal(true)}
            className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
              isDark ? 'hover:bg-[#282828]' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {isFirstTimeUser ? 'Setup Password' : 'Vault Settings'}
                </span>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isFirstTimeUser ? 'Create your vault password' : 'Manage vault and files'}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Language Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-5 py-3 border-b transition-colors ${
            isDark ? 'bg-[#252525] border-[#2d2d2d]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {t('language')}
            </h2>
          </div>

          {/* Language Selector */}
          <button
            onClick={() => setShowLanguageModal(true)}
            className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
              isDark ? 'hover:bg-[#282828]' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('language')}</span>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Session Section */}
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-5 py-3 border-b transition-colors ${
            isDark ? 'bg-[#252525] border-[#2d2d2d]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {settings.language === 'hi' ? 'खाता सत्र' : 'Account Session'}
            </h2>
          </div>

          {/* Log Out Action */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
              isDark ? 'hover:bg-[#282828] text-rose-400' : 'hover:bg-gray-50 text-rose-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold">
                  {settings.language === 'hi' ? 'लॉग आउट' : 'Log out'}
                </span>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-400/80' : 'text-rose-500/70'}`}>
                  {settings.language === 'hi' ? 'सत्र से सुरक्षित रूप से लॉग आउट करें' : 'Sign out securely from this session'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLanguageModal(false)} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d] text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2d2d2d]' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('selectLanguage')}</h3>
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'hover:bg-[#282828] text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Language List */}
            <div className="overflow-y-auto max-h-[60vh] p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full px-4 py-3 rounded-xl flex items-center justify-between mb-2 transition-all ${
                    settings.language === lang.code
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : isDark ? 'hover:bg-[#282828] text-white' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className="font-medium">{lang.name}</span>
                  {settings.language === lang.code && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History View Modal */}
      {showHistoryView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistoryView(false)} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d] text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2d2d2d]' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('viewHistory')}</h3>
                <button
                  onClick={() => setShowHistoryView(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'hover:bg-[#282828] text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                    isDark ? 'bg-[#282828]' : 'bg-gray-100'
                  }`}>
                    <Clock className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('noHistory')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl p-4 border transition-colors ${
                        isDark ? 'bg-[#282828] border-[#333333]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {item.expression} = {item.result}
                      </p>
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{item.date}</span>
                        <span className="mx-1">•</span>
                        <Clock className="w-4 h-4" />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in p-6 border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-red-950/50' : 'bg-red-100'}`}>
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-500">
                  {t('deleteConfirmTitle')}
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>
                  {t('deleteConfirmMessage')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium border transition-colors ${
                  isDark ? 'bg-[#282828] text-gray-300 border-[#383838] hover:bg-[#333333]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
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
      )}

      {/* Export Sheet */}
      {showExportSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExportSheet(false)} />
          <div className={`relative rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6">
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t('exportHistory')}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('pdf')}
                  className={`w-full px-4 py-4 rounded-xl flex items-center gap-4 transition-colors border ${
                    isDark ? 'bg-[#282828] border-[#333333] hover:bg-[#333333]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('exportAsPdf')}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Export as PDF document</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className={`w-full px-4 py-4 rounded-xl flex items-center gap-4 transition-colors border ${
                    isDark ? 'bg-[#282828] border-[#333333] hover:bg-[#333333]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('exportAsTxt')}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Export as text file</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSecurityModal(false)} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in p-6 border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {isFirstTimeUser ? 'Setup Password' : 'Enter Password'}
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isFirstTimeUser 
                    ? 'Create a secure password for your vault (minimum 4 digits)' 
                    : 'Enter your vault password to access settings'
                  }
                </p>
              </div>
            </div>
            <div className="mb-4">
              <input
                type="password"
                value={securityPassword}
                onChange={(e) => setSecurityPassword(e.target.value)}
                placeholder={isFirstTimeUser ? 'Create new password' : 'Enter password'}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark ? 'bg-[#282828] border-[#383838] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSecurityUnlock();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSecurityModal(false);
                  setSecurityPassword('');
                }}
                className={`flex-1 px-4 py-3 rounded-xl font-medium border transition-colors ${
                  isDark ? 'bg-[#282828] text-gray-300 border-[#383838] hover:bg-[#333333]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSecurityUnlock}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                {isFirstTimeUser ? 'Set Password' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in p-6 text-center space-y-5 border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d]' : 'bg-white border-gray-200'
          }`}>
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-100 text-rose-600'
            }`}>
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {settings.language === 'hi' ? 'लॉग आउट की पुष्टि करें' : 'Confirm Log out'}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {settings.language === 'hi'
                  ? 'क्या आप वाकई इस सत्र से लॉग आउट करना चाहते हैं? आपके सुरक्षित लॉक किए गए चैट सुरक्षित रहेंगे।'
                  : 'Are you sure you want to log out from this session? Your locked chats will remain secure.'}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  isDark ? 'bg-[#282828] hover:bg-[#333333] text-gray-300 border-[#383838]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300/40'
                }`}
              >
                {settings.language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  signOutGoogle();
                  lockVault();
                  onClose?.();
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg"
              >
                {settings.language === 'hi' ? 'लॉग आउट' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {showSnackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg">
            {snackbarMessage}
          </div>
        </div>
      )}
    </div>
  );
};
