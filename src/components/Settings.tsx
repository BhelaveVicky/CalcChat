import React, { useState, useEffect } from 'react';
import { Moon, Sun, History, Globe, ChevronRight, X, Eye, EyeOff, Trash2, Download, Calendar, Clock, Lock, Shield, LogOut, AlertTriangle, Mail, RefreshCw, KeyRound, Check, Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
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
    profile,
    lockVault,
    clearAllChatHistory,
    completeChatPasswordSetup
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

  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState<'none' | 'confirm_delete' | 'otp' | 'new_password'>('none');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState(false);
  const [resendTimer, setResendTimer] = useState(180); // 3 Minutes (180s)
  const [otpExpiryTimestamp, setOtpExpiryTimestamp] = useState<number>(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showRevealedOtp, setShowRevealedOtp] = useState(false);
  const [otpTargetEmail, setOtpTargetEmail] = useState<string>(() => {
    return authUser?.email || profile?.email || 'paurnimabhelave@gmail.com';
  });
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Sync default target email if authUser becomes available
  useEffect(() => {
    const activeMail = authUser?.email || profile?.email || 'paurnimabhelave@gmail.com';
    if (activeMail && !otpTargetEmail) {
      setOtpTargetEmail(activeMail);
    }
  }, [authUser, profile]);

  // Timer countdown for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const sendOtpToUserEmail = async (overrideEmail?: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSentMsg(true);
    setResendTimer(180); // 3 Minutes
    setOtpExpiryTimestamp(Date.now() + 180 * 1000);
    setIsSendingEmail(true);

    const targetEmail = (overrideEmail || otpTargetEmail || authUser?.email || profile?.email || 'paurnimabhelave@gmail.com').trim();
    setOtpTargetEmail(targetEmail);

    // Trigger Browser OS Notification if permitted
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('CalcChat Security Bot 🤖', {
            body: `Your Password Reset OTP Code is: ${code} (Valid for 3 mins)`,
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
              new Notification('CalcChat Security Bot 🤖', {
                body: `Your Password Reset OTP Code is: ${code} (Valid for 3 mins)`,
              });
            }
          });
        }
      }
    } catch (e) {}
    
    // 1. Google Firebase Security Mailer Bot
    if (firebaseAuth && targetEmail) {
      try {
        await sendPasswordResetEmail(firebaseAuth, targetEmail);
      } catch (e) {
        console.warn('Firebase password reset email attempt:', e);
      }
    }

    // 2. Web3Forms Direct Mail Bot API (Sender Name: CalcChat Vault)
    if (targetEmail) {
      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: '27161b36-a19f-43fb-b78f-efae54848350',
            subject: `🔐 CalcChat - OTP Verification Code: ${code}`,
            from_name: 'CalcChat Vault 🔒',
            name: 'CalcChat Vault',
            to_email: targetEmail,
            email: targetEmail,
            message: `🤖 [CalcChat Automated Security Bot]\n\nHello ${authUser?.displayName || profile?.name || 'User'},\n\nA request was made to reset your secret CalcChat Vault password.\n\nYour 6-digit OTP Verification Code is:\n\n👉  ${code}  👈\n\n⏰ This OTP is valid for 3 minutes.\nIf you did not request this password reset, please ignore this email.\n\nCalcChat Security Team`
          })
        }).catch(err => console.warn('Web3Forms Bot API warning:', err));
      } catch (err) {
        console.warn('Web3Forms dispatch error:', err);
      }

      // 3. Backup FormSubmit Relay with CalcChat Sender Name
      try {
        await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `🔐 CalcChat - OTP Verification Code: ${code}`,
            _site_name: 'CalcChat',
            _replyto: 'support@calcchat.app',
            name: 'CalcChat Vault 🔒',
            from_name: 'CalcChat Vault 🔒',
            email: targetEmail,
            message: `🤖 [CalcChat Automated Security Bot]\n\nHello ${authUser?.displayName || profile?.name || 'User'},\n\nYour secret 6-digit OTP code for resetting your CalcChat Vault password is: ${code}\n\nThis OTP is valid for 3 minutes.\n\nCalcChat Security Team`,
            _template: 'box'
          })
        }).catch(err => console.warn('Automated Security Bot API warning:', err));
      } catch (err) {
        console.warn('Security Bot Email dispatch error:', err);
      } finally {
        setIsSendingEmail(false);
      }
    } else {
      setIsSendingEmail(false);
    }
  };

  const isFirstTimeUser = !vaultSettings?.passcode;

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
        setSnackbarMessage('Incorrect Password! Try again or click Forgot Password.');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-blue-600 shadow-lg">
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
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-blue-600 shadow-lg">
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
              {!isFirstTimeUser && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecurityModal(false);
                      setSecurityPassword('');
                      setForgotStep('confirm_delete');
                    }}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
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

      {/* Forgot Password Step 1: Warning & Data Deletion Confirmation */}
      {forgotStep === 'confirm_delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setForgotStep('none')} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in p-6 border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d] text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-1">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-rose-500">
                Warning: Data Will Be Cleared!
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                If you reset your forgot password, <strong className="text-rose-500 font-semibold">all your internal vault data and chat history will be permanently deleted</strong>.
              </p>
              <div className={`w-full p-3.5 rounded-2xl border text-xs text-left ${
                isDark ? 'bg-[#252525] border-[#333333] text-gray-300' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                ⚠️ <strong>Aapka chat history aur local vault reset ho jayega.</strong> Kya aap aage badhna chahte hain?
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForgotStep('none')}
                className={`flex-1 py-3 rounded-2xl font-semibold text-sm border transition-colors ${
                  isDark ? 'bg-[#282828] text-gray-300 border-[#383838] hover:bg-[#333333]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Perform data reset
                  await clearAllChatHistory();
                  clearHistory();
                  sendOtpToUserEmail();
                  setUserOtpInput('');
                  setForgotError(null);
                  setForgotStep('otp');
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-sm transition-all shadow-lg cursor-pointer"
              >
                Yes, Reset & Send OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Step 2: Email OTP Verification */}
      {forgotStep === 'otp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setForgotStep('none')} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in p-6 border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d] text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Verify OTP Code</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  OTP code sent to <span className="font-semibold text-blue-400">{authUser?.email || 'your email'}</span>
                </p>
              </div>
            </div>

            {/* Target Email Confirmation & Sent alert badge */}
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 shrink-0 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-xs">OTP Sent to Gmail Inbox 📩</p>
                  <p className="text-[11.5px] text-gray-300 font-normal leading-tight mt-0.5">
                    Target Email: <span className="text-emerald-400 font-semibold underline">{otpTargetEmail}</span>
                  </p>
                </div>
              </div>

              {/* Reveal Code Helper Card */}
              {showRevealedOtp && (
                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-center font-bold text-sm tracking-widest animate-fade-in">
                  Sent OTP Code: <span className="text-white bg-blue-600 px-2.5 py-0.5 rounded-lg text-base ml-1">{generatedOtp}</span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-emerald-500/20 mt-1">
                <a
                  href="https://mail.google.com/mail/u/0/#search/CalcChat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open Gmail ↗</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowRevealedOtp(!showRevealedOtp)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-300 hover:text-white bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    {showRevealedOtp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showRevealedOtp ? 'Hide Code' : 'Reveal Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserOtpInput(generatedOtp);
                      setForgotError(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    title="Click to auto-fill OTP code"
                  >
                    <span>⚡ Auto-Fill</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enter 6-Digit OTP
                </label>
                <span className="text-[11.5px] font-medium text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {resendTimer > 0 
                    ? `Valid for 3 mins (${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')})`
                    : 'OTP Expired'}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={userOtpInput}
                onChange={(e) => {
                  setUserOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                  setForgotError(null);
                }}
                placeholder="Enter OTP (e.g. 123456)"
                className={`w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark ? 'bg-[#282828] border-[#383838] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
              />
              {forgotError && (
                <p className="text-xs text-rose-500 font-semibold mt-2 text-center">{forgotError}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs mb-5">
              <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Take your time to check your Gmail inbox.
              </span>
              <button
                type="button"
                disabled={isSendingEmail}
                onClick={() => sendOtpToUserEmail()}
                className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                <span>{isSendingEmail ? 'Sending...' : 'Resend OTP'}</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForgotStep('none')}
                className={`flex-1 py-3 rounded-2xl font-semibold text-sm border transition-colors ${
                  isDark ? 'bg-[#282828] text-gray-300 border-[#383838] hover:bg-[#333333]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={userOtpInput.length < 6}
                onClick={() => {
                  if (resendTimer === 0 || (otpExpiryTimestamp > 0 && Date.now() > otpExpiryTimestamp)) {
                    setForgotError('OTP has expired! It is only valid for 3 minutes. Please click Resend OTP to get a new code.');
                    return;
                  }
                  if (userOtpInput.trim() === generatedOtp) {
                    setForgotNewPass('');
                    setForgotConfirmPass('');
                    setForgotError(null);
                    setForgotStep('new_password');
                  } else {
                    setForgotError('Invalid 6-digit OTP code! Please check your Gmail inbox and enter again.');
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg"
              >
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Step 3: Create New Password */}
      {forgotStep === 'new_password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setForgotStep('none')} />
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in p-6 border transition-colors ${
            isDark ? 'bg-[#1e1e1e] border-[#2d2d2d] text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Set New Password</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Create a new password or PIN for your secret calculator vault
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const cleanNew = forgotNewPass.trim();
                const cleanConfirm = forgotConfirmPass.trim();

                if (!cleanNew) {
                  setForgotError('Please enter a new password');
                  return;
                }
                if (cleanNew.length < 4) {
                  setForgotError('Password must be at least 4 characters');
                  return;
                }
                if (cleanNew !== cleanConfirm) {
                  setForgotError('Passwords do not match');
                  return;
                }

                try {
                  setIsResettingPass(true);
                  setForgotError(null);
                  await completeChatPasswordSetup(cleanNew);
                  setForgotStep('none');
                  setSnackbarMessage('Password reset successfully! Vault history cleared.');
                  setShowSnackbar(true);
                  setTimeout(() => setShowSnackbar(false), 4000);
                } catch (err: any) {
                  setForgotError(err.message || 'Failed to reset password');
                } finally {
                  setIsResettingPass(false);
                }
              }}
              className="space-y-4"
            >
              {/* New Password Input */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enter New Password / PIN
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showForgotNewPass ? 'text' : 'password'}
                    value={forgotNewPass}
                    onChange={(e) => {
                      setForgotNewPass(e.target.value);
                      setForgotError(null);
                    }}
                    placeholder="Enter new password (min 4 chars)"
                    className={`w-full rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      isDark ? 'bg-[#282828] border-[#383838] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 p-1"
                  >
                    {showForgotNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm New Password / PIN
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showForgotConfirmPass ? 'text' : 'password'}
                    value={forgotConfirmPass}
                    onChange={(e) => {
                      setForgotConfirmPass(e.target.value);
                      setForgotError(null);
                    }}
                    placeholder="Re-enter new password"
                    className={`w-full rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      forgotNewPass && forgotConfirmPass && forgotNewPass === forgotConfirmPass
                        ? 'border-2 border-emerald-500'
                        : isDark ? 'bg-[#282828] border-[#383838] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 p-1"
                  >
                    {showForgotConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {forgotNewPass.length >= 4 && forgotConfirmPass.length >= 4 && forgotNewPass === forgotConfirmPass && (
                  <p className="mt-1.5 text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>

              {forgotError && (
                <p className="text-xs text-rose-500 font-semibold">{forgotError}</p>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setForgotStep('none')}
                  className={`flex-1 py-3 rounded-2xl font-semibold text-sm border transition-colors ${
                    isDark ? 'bg-[#282828] text-gray-300 border-[#383838] hover:bg-[#333333]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!forgotNewPass || forgotNewPass.length < 4 || forgotNewPass !== forgotConfirmPass || isResettingPass}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isResettingPass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Open Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
