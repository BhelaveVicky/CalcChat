import React, { useState } from 'react';
import {
  User, Key, Shield, MessageSquare, Bell, Keyboard, HelpCircle,
  LogOut, Search, X, ChevronRight, Moon, Sun, Globe, History,
  Trash2, Download, Clock, Eye, EyeOff, ShieldAlert, Check,
  Smartphone, Palette, Lock, RefreshCw, Archive, Star, Camera,
  Plus, Crown, ShieldCheck, Image as ImageIcon, Sliders
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { compressImage } from '../lib/mediaCompressor';
import { checkIsAdmin } from '../lib/adminUtils';
import { SetChatWallpaperModal } from './SetChatWallpaperModal';
import { WallpaperSuccessOverlay } from './WallpaperSuccessOverlay';

/* ─── tiny helpers ───────────────────────────────────────── */
const Toggle: React.FC<{ on: boolean; onChange: () => void; color?: string }> = ({
  on, onChange, color = 'bg-[#00a8ff]'
}) => (
  <button
    onClick={onChange}
    className={`relative w-[50px] h-[27px] rounded-full transition-colors duration-300 focus:outline-none ${on ? color : 'bg-[#374151]'}`}
    role="switch" aria-checked={on}
  >
    <span
      className={`absolute top-[3px] left-[3px] w-[21px] h-[21px] rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-[23px]' : 'translate-x-0'}`}
    />
  </button>
);

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}> = ({ icon, label, sub, onClick, right, danger }) => (
  <div
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-3.5 transition-colors text-left ${onClick ? 'cursor-pointer hover:bg-white/5 active:bg-white/10' : ''}`}
  >
    <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-[#8696a0]'}`}>{icon}</span>
    <div className="flex-1 min-w-0">
      <p className={`text-[15px] font-medium leading-tight ${danger ? 'text-red-400' : 'text-[#e9edef]'}`}>{label}</p>
      {sub && <p className="text-[12.5px] text-[#8696a0] mt-0.5 truncate">{sub}</p>}
    </div>
    {right !== undefined ? right : (
      onClick ? <ChevronRight className="w-4 h-4 text-[#8696a0] shrink-0" /> : null
    )}
  </div>
);

const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className={`${label ? 'px-5 pt-5 pb-1' : 'h-[6px] bg-[#111b21]'}`}>
    {label && <p className="text-[13px] font-semibold text-[#00a8ff] uppercase tracking-wider">{label}</p>}
  </div>
);

/* ─── Language Modal ──────────────────────────────────────── */
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'ur', label: 'اردو (Urdu)' },
];

const LanguageModal: React.FC<{ current: string; onSelect: (c: string) => void; onClose: () => void }> = ({ current, onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div
      className="w-full sm:w-96 bg-[#1f2c34] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3942]">
        <h3 className="text-white font-bold text-lg">Select Language</h3>
        <button onClick={onClose} className="text-[#8696a0] hover:text-white p-1"><X className="w-5 h-5" /></button>
      </div>
      <div className="overflow-y-auto flex-1">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => { onSelect(lang.code); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${current === lang.code ? 'border-[#00a8ff]' : 'border-[#8696a0]'}`}>
              {current === lang.code && <div className="w-2.5 h-2.5 rounded-full bg-[#00a8ff]" />}
            </div>
            <span className={`text-[15px] ${current === lang.code ? 'text-[#00a8ff] font-semibold' : 'text-[#e9edef]'}`}>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ─── History View ────────────────────────────────────────── */
const HistoryView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { history, clearHistory } = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [snack, setSnack] = useState('');

  const showSnack = (msg: string) => {
    setSnack(msg);
    setTimeout(() => setSnack(''), 3000);
  };

  const handleDelete = () => {
    clearHistory();
    setShowDeleteConfirm(false);
    showSnack('History Deleted Successfully');
  };

  const handleExport = (format: 'txt' | 'pdf') => {
    if (history.length === 0) { showSnack('No history to export'); return; }
    if (format === 'txt') {
      const content = history.map(h => `${h.expression} = ${h.result}\n${h.date}  ${h.time}`).join('\n\n');
      const blob = new Blob([`Calculator History\n\n${content}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'calc_history.txt'; a.click();
      URL.revokeObjectURL(url);
    } else {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<html><head><title>Calculator History</title><style>body{font-family:sans-serif;padding:24px;max-width:600px;margin:auto}h1{font-size:20px;margin-bottom:16px}.card{border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:12px}.exp{font-size:15px;font-weight:600;color:#1a202c}.res{font-size:22px;font-weight:700;color:#2563eb;margin:4px 0}.dt{font-size:12px;color:#718096}</style></head><body><h1>Calculator History</h1>${history.map(h => `<div class="card"><div class="exp">${h.expression}</div><div class="res">= ${h.result}</div><div class="dt">${h.date} &nbsp;${h.time}</div></div>`).join('')}</body></html>`);
        win.document.close(); win.print();
      }
    }
    setShowExportSheet(false);
    showSnack('History Exported Successfully');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942]">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-[#8696a0]" />
        </button>
        <h2 className="text-white font-semibold text-lg flex-1">Calculation History</h2>
        {history.length > 0 && (
          <>
            <button onClick={() => setShowExportSheet(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Download className="w-5 h-5 text-[#8696a0]" /></button>
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Trash2 className="w-5 h-5 text-red-400" /></button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <div className="w-20 h-20 rounded-full bg-[#1f2c34] flex items-center justify-center">
              <Clock className="w-10 h-10 text-[#8696a0]" />
            </div>
            <p className="text-[#8696a0] text-center text-base font-medium">No Calculation History</p>
            <p className="text-[#8696a0]/60 text-center text-sm max-w-xs">Enable "Save History" in settings to start recording your calculations.</p>
          </div>
        ) : history.map((item, i) => (
          <div key={i} className="bg-[#1f2c34] rounded-2xl px-4 py-3.5 border border-[#2a3942]/60 shadow-sm">
            <p className="text-[13px] text-[#8696a0] font-medium mb-1">{item.expression}</p>
            <p className="text-2xl font-bold text-white mb-2">= {item.result}</p>
            <div className="flex items-center gap-3 text-[11.5px] text-[#8696a0]">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span>
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#1f2c34] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Delete History?</h3>
            <p className="text-[#8696a0] text-sm mb-6">Are you sure you want to permanently delete all saved calculations?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-[#2a3942] text-[#e9edef] font-semibold hover:bg-[#374151] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Bottom Sheet */}
      {showExportSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowExportSheet(false)}>
          <div className="w-full sm:w-96 bg-[#1f2c34] rounded-t-3xl pb-8 pt-3" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#8696a0]/40 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-bold text-base px-5 mb-4">Export History As</h3>
            <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
              <Archive className="w-5 h-5 text-[#00a8ff]" />
              <span className="text-[#e9edef] text-[15px]">Export as PDF</span>
            </button>
            <button onClick={() => handleExport('txt')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
              <Download className="w-5 h-5 text-[#00a8ff]" />
              <span className="text-[#e9edef] text-[15px]">Export as TXT</span>
            </button>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snack && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1f2c34] border border-[#2a3942] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-[#00a8ff]" />{snack}
        </div>
      )}
    </div>
  );
};

/* ─── Vault Security Sub-page ────────────────────────────── */
const VaultSecurityView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings, updateSettings, lockVault, clearChatHistory, contacts } = useVault();
  const [passcode, setPasscode] = useState(settings.passcode);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!passcode.trim()) { alert('Passcode cannot be empty!'); return; }
    updateSettings({ passcode: passcode.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEmergencyErase = () => {
    if (confirm('🚨 EMERGENCY ERASE: Delete all chats, media and reset? This cannot be undone!')) {
      contacts.forEach(c => clearChatHistory(c.id));
      localStorage.clear();
      lockVault();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942] sticky top-0 z-10">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-[#8696a0]" /></button>
        <h2 className="text-white font-semibold text-lg">Vault Security</h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Passcode */}
        <div className="bg-[#1f2c34] rounded-2xl p-5 border border-[#2a3942]">
          <label className="text-[#00a8ff] font-semibold text-sm flex items-center gap-2 mb-1"><Lock className="w-4 h-4" />Secret Passcode</label>
          <p className="text-[#8696a0] text-xs mb-3">Type this on the calculator followed by "=" to unlock</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="flex-1 bg-[#111b21] border border-[#2a3942] focus:border-[#00a8ff] font-mono text-xl font-bold tracking-widest text-[#00a8ff] rounded-xl px-4 py-2.5 focus:outline-none"
            />
            <button onClick={() => setPasscode('1234')} className="px-3 bg-[#2a3942] hover:bg-[#374151] rounded-xl text-[#8696a0] text-sm transition-colors">Reset</button>
          </div>
          <button
            onClick={handleSave}
            className="mt-4 w-full bg-[#00a8ff] hover:bg-[#0088cc] active:scale-95 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {saved ? <><Check className="w-4 h-4" />Saved!</> : <><RefreshCw className="w-4 h-4" />Save Passcode</>}
          </button>
        </div>

        {/* Auto-lock */}
        <div className="bg-[#1f2c34] rounded-2xl p-5 border border-[#2a3942]">
          <label className="text-[#00a8ff] font-semibold text-sm flex items-center gap-2 mb-1"><Clock className="w-4 h-4" />Auto-Lock Timer</label>
          <p className="text-[#8696a0] text-xs mb-3">Automatically return to calculator when idle</p>
          <select
            value={settings.autoLockMinutes}
            onChange={e => updateSettings({ autoLockMinutes: Number(e.target.value) })}
            className="w-full bg-[#111b21] border border-[#2a3942] text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a8ff]"
          >
            <option value={0}>Immediately on window switch</option>
            <option value={1}>After 1 minute</option>
            <option value={5}>After 5 minutes (Default)</option>
            <option value={15}>After 15 minutes</option>
            <option value={60}>Never</option>
          </select>
        </div>

        {/* Theme */}
        <div className="bg-[#1f2c34] rounded-2xl p-5 border border-[#2a3942]">
          <label className="text-[#00a8ff] font-semibold text-sm flex items-center gap-2 mb-3"><Palette className="w-4 h-4" />Vault Theme</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'material-dark', label: 'Material Dark', sub: 'Slate & Emerald' },
              { id: 'amoled-black', label: 'AMOLED Black', sub: 'Pure Black' },
              { id: 'cyberpunk', label: 'Cyberpunk Neon', sub: 'Synthwave Magenta' },
              { id: 'emerald-vault', label: 'Matrix Emerald', sub: 'Hacker Terminal' },
              { id: 'material-light', label: 'Light Mode', sub: 'Clean Light' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => updateSettings({ theme: t.id as any })}
                className={`p-3 rounded-xl border text-left transition-all ${settings.theme === t.id ? 'bg-[#00a8ff]/10 border-[#00a8ff]' : 'bg-[#111b21] border-[#2a3942] hover:border-[#374151]'}`}
              >
                <div className="font-semibold text-[#e9edef] text-sm">{t.label}</div>
                <div className="text-[10.5px] text-[#8696a0]">{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Erase */}
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 text-center">
          <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="font-bold text-red-300 mb-1">Emergency Vault Wipe</h3>
          <p className="text-red-200/60 text-xs mb-4 max-w-xs mx-auto">Erase all chats, media, and reset to default calculator.</p>
          <button onClick={handleEmergencyErase} className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            🚨 Execute Emergency Erase
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Chats Settings SubView ──────────────────────────────── */
const ChatsSubView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { 
    settings: vaultSettings, updateSettings: updateVaultSettings, clearAllChatHistory,
    user, authUser, adminWallpapers, addAdminWallpaper, deleteAdminWallpaper 
  } = useVault();
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
  const [adminWallpaperName, setAdminWallpaperName] = useState('');
  const [adminWallpaperUrl, setAdminWallpaperUrl] = useState('');
  const [isAddingAdminWp, setIsAddingAdminWp] = useState(false);
  const [showLiveWallpaperModal, setShowLiveWallpaperModal] = useState(false);
  const [snack, setSnack] = useState('');
  const [fullScreenSuccessMsg, setFullScreenSuccessMsg] = useState<string | null>(null);
  
  const wallpaperInputRef = React.useRef<HTMLInputElement>(null);
  const adminWpFileInputRef = React.useRef<HTMLInputElement>(null);

  const isAdmin = checkIsAdmin(user) || checkIsAdmin(authUser?.email);

  const showSnack = (msg: string) => {
    setSnack(msg);
    setTimeout(() => setSnack(''), 3000);
  };

  const triggerSuccessOverlay = (msg: string = 'Wallpaper Set Successfully!') => {
    setFullScreenSuccessMsg(msg);
    setTimeout(() => {
      setFullScreenSuccessMsg(null);
    }, 2200);
  };

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  const defaultPresets = [
    { id: 'preset_1', name: 'Default', bg: 'default', color: isDark ? '#0b141a' : '#efeae2', isImage: false, isAdminAdded: false },
    { id: 'preset_2', name: 'Dark Charcoal', bg: '#111b21', color: '#111b21', isImage: false, isAdminAdded: false },
    { id: 'preset_3', name: 'Deep Slate', bg: '#1e293b', color: '#1e293b', isImage: false, isAdminAdded: false },
    { id: 'preset_4', name: 'Emerald Dark', bg: '#062c1b', color: '#062c1b', isImage: false, isAdminAdded: false },
    { id: 'preset_img_1', name: 'Geometric Dark', bg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', color: '#1e293b', isImage: true, isAdminAdded: false },
    { id: 'preset_img_2', name: 'Neon Glow', bg: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80', color: '#1e293b', isImage: true, isAdminAdded: false },
    { id: 'preset_img_3', name: 'Deep Space', bg: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80', color: '#1e293b', isImage: true, isAdminAdded: false },
    { id: 'preset_img_4', name: 'Minimal Nature', bg: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80', color: '#1e293b', isImage: true, isAdminAdded: false },
  ];

  const adminPresets = (adminWallpapers || []).map((wp, idx) => ({
    id: wp.id,
    name: wp.name || `Admin Wallpaper ${idx + 1}`,
    bg: wp.url,
    color: wp.color || '#1e293b',
    isImage: true,
    isAdminAdded: true,
  }));

  const allSwatches = [...defaultPresets, ...adminPresets];

  const handleAddAdminWp = async (url: string, name?: string) => {
    if (!url.trim()) return;
    setIsAddingAdminWp(true);
    try {
      await addAdminWallpaper(name || adminWallpaperName || 'Admin Wallpaper', url);
      showSnack('New wallpaper added to global swatches!');
      setAdminWallpaperName('');
      setAdminWallpaperUrl('');
    } catch (e) {
      showSnack('Failed to add wallpaper');
    } finally {
      setIsAddingAdminWp(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] h-full overflow-y-auto font-sans animate-fade-in">
      <div className="flex items-center gap-4 px-5 py-4 bg-[#111b21] border-b border-[#1f2c34] sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 rounded-full text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef] transition-colors cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Chats Settings</h1>
      </div>

      <div className="p-5 max-w-md mx-auto w-full space-y-7">
        {/* Theme Section */}
        <div>
          <h3 className="text-sm font-semibold text-[#8696a0] mb-3">Theme</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                updateVaultSettings({ theme: 'material-light' });
                showSnack('Light theme applied');
              }}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all h-28 cursor-pointer ${
                !isDark ? 'border-[#0095f6] bg-[#f0f8ff]' : 'border-[#1f2c34] bg-[#111b21] hover:border-gray-600'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-300 mb-1.5 flex items-center justify-center shadow-sm">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
              <span className={`text-xs font-bold ${!isDark ? 'text-[#0095f6]' : 'text-[#e9edef]'}`}>Light</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateVaultSettings({ theme: 'material-dark' });
                showSnack('Dark theme applied');
              }}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all h-28 cursor-pointer ${
                isDark ? 'border-[#0095f6] bg-[#111b21]' : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#1f2c34] border border-[#2a3942] mb-1.5 flex items-center justify-center shadow-sm">
                <Moon className="w-5 h-5 text-sky-400" />
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-[#0095f6]' : 'text-gray-900'}`}>Dark</span>
            </button>
          </div>
        </div>

        {/* Wallpaper Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#8696a0] flex items-center gap-1.5">
              <span>Chat Wallpaper</span>
              {adminPresets.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] text-[10px] font-bold">
                  +{adminPresets.length} Admin
                </span>
              )}
            </h3>
            {vaultSettings?.chatWallpaper && vaultSettings.chatWallpaper !== 'default' && (
              <button
                type="button"
                onClick={() => {
                  updateVaultSettings({ 
                    chatWallpaper: 'default',
                    chatWallpaperBlur: 0,
                    chatWallpaperBrightness: 100,
                  });
                  triggerSuccessOverlay('Wallpaper Reset Successfully!');
                }}
                className="text-xs text-[#00a8ff] hover:underline font-medium cursor-pointer"
              >
                Reset Default
              </button>
            )}
          </div>

          {/* WhatsApp Style Live Preview Launcher */}
          <button
            type="button"
            onClick={() => setShowLiveWallpaperModal(true)}
            className="w-full mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#111b21] to-[#1f2c34] border border-[#00a8ff]/40 hover:border-[#00a8ff] flex items-center justify-between text-left shadow-lg cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00a8ff]/15 text-[#00a8ff] flex items-center justify-center border border-[#00a8ff]/30 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#e9edef] group-hover:text-[#00a8ff] transition-colors">
                  WhatsApp Live Chat Preview
                </p>
                <p className="text-[11px] text-[#8696a0]">
                  Full screen preview, blur & brightness sliders
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8696a0] group-hover:text-[#00a8ff] group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Active Preview */}
          {vaultSettings?.chatWallpaper !== undefined && (
            <div className="mb-4 p-3 rounded-2xl bg-[#111b21] border border-[#2a3942] flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl border border-gray-600 shadow-sm shrink-0 overflow-hidden relative"
                style={
                  vaultSettings?.chatWallpaper && vaultSettings.chatWallpaper !== 'default'
                    ? vaultSettings.chatWallpaper.startsWith('data:') || vaultSettings.chatWallpaper.startsWith('http') || vaultSettings.chatWallpaper.startsWith('blob:') || vaultSettings.chatWallpaper.startsWith('/') || vaultSettings.chatWallpaper.includes('.')
                      ? { backgroundImage: `url("${vaultSettings.chatWallpaper}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { backgroundColor: vaultSettings.chatWallpaper }
                    : { backgroundImage: 'url("/default-chat-bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }
                }
              >
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#e9edef] truncate">Active Custom Wallpaper</p>
                <p className="text-[11px] text-[#8696a0] truncate">Applied across all chats</p>
              </div>
            </div>
          )}

          {/* Swatches Grid (Presets + Admin Wallpapers) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4 max-h-[65vh] overflow-y-auto p-1">
            {allSwatches.map((swatch) => {
              const isSelected = 
                (swatch.bg === 'default' && (!vaultSettings?.chatWallpaper || vaultSettings?.chatWallpaper === 'default')) ||
                vaultSettings?.chatWallpaper === swatch.bg;

              const isImage = swatch.isImage || swatch.bg.startsWith('data:') || swatch.bg.startsWith('http') || swatch.bg.startsWith('blob:');

              return (
                <div key={swatch.id} className="relative group">
                  <button
                    type="button"
                    title={swatch.name}
                    onClick={() => {
                      updateVaultSettings({ chatWallpaper: swatch.bg });
                      triggerSuccessOverlay(`Wallpaper Set Successfully!`);
                    }}
                    className={`w-full h-20 sm:h-24 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-between p-1.5 shadow-sm ${
                      isSelected 
                        ? 'border-[#00a8ff] ring-2 ring-[#00a8ff]/30 scale-[1.02] shadow-md z-10' 
                        : 'border-gray-700/60 hover:border-gray-500 hover:scale-[1.01]'
                    }`}
                    style={
                      isImage 
                        ? { backgroundImage: `url("${swatch.bg}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { backgroundColor: swatch.color }
                    }
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <div className="w-6 h-6 rounded-full bg-[#00a8ff] text-white flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between z-10">
                      {swatch.isAdminAdded ? (
                        <span className="px-1.5 py-0.5 bg-[#00a8ff] text-[#0b141a] text-[8px] font-black rounded uppercase tracking-wider shadow">
                          ADMIN
                        </span>
                      ) : isImage ? (
                        <span className="px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded shadow backdrop-blur-sm">
                          HD
                        </span>
                      ) : <span />}
                    </div>

                    <span className="w-full text-[9.5px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate text-center z-10 bg-black/30 backdrop-blur-[2px] py-0.5 px-1 rounded-md">
                      {swatch.name}
                    </span>
                  </button>

                  {/* Admin Delete Icon */}
                  {isAdmin && swatch.isAdminAdded && (
                    <button
                      type="button"
                      title="Delete Admin Wallpaper"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Remove "${swatch.name}" from global wallpapers?`)) {
                          await deleteAdminWallpaper(swatch.id);
                          showSnack('Admin wallpaper removed');
                        }
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all z-20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Device Upload / Custom URL */}
          <input
            ref={wallpaperInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                  if (event.target?.result) {
                    const raw = event.target.result as string;
                    const compressed = await compressImage(raw, 800, 200000);
                    updateVaultSettings({ chatWallpaper: compressed || raw });
                    triggerSuccessOverlay('Custom Wallpaper Set Successfully!');
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={() => wallpaperInputRef.current?.click()}
              className="w-full p-3 rounded-2xl border-2 border-dashed border-[#2a3942] hover:border-gray-500 bg-[#111b21] text-[#8696a0] hover:text-[#e9edef] flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Camera className="w-4 h-4 text-[#00a8ff]" />
              <span>Upload custom image for yourself</span>
            </button>

            <div className="flex gap-2">
              <input
                type="url"
                value={customWallpaperUrl}
                onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                placeholder="Or paste image URL..."
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs border border-[#2a3942] bg-[#111b21] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a8ff] outline-none transition-all"
              />
              <button
                type="button"
                disabled={!customWallpaperUrl.trim()}
                onClick={() => {
                  if (customWallpaperUrl.trim()) {
                    updateVaultSettings({ chatWallpaper: customWallpaperUrl.trim() });
                    triggerSuccessOverlay('Wallpaper Set Successfully!');
                    setCustomWallpaperUrl('');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] disabled:opacity-40 text-[#0b141a] text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Admin Wallpaper Control Section */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-[#111b21] border border-[#00a8ff]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00a8ff]" />
                  <h4 className="font-bold text-xs text-[#00a8ff] uppercase tracking-wider">
                    Admin Panel: Add Preset Wallpaper
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#00a8ff]/10 text-[#00a8ff] text-[10px] font-bold">
                  GLOBAL
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0]">
                Wallpapers added here will instantly appear for ALL users in their chat wallpaper selection grid.
              </p>

              <input
                ref={adminWpFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      if (ev.target?.result) {
                        const raw = ev.target.result as string;
                        const compressed = await compressImage(raw, 800, 200000);
                        await handleAddAdminWp(compressed || raw, file.name.split('.')[0]);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <div className="space-y-2">
                <input
                  type="text"
                  value={adminWallpaperName}
                  onChange={(e) => setAdminWallpaperName(e.target.value)}
                  placeholder="Wallpaper Title (e.g. Sunset Glow)"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#2a3942] bg-[#0b141a] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a8ff] outline-none"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isAddingAdminWp}
                    onClick={() => adminWpFileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#1f2c34] hover:bg-[#2a3942] text-xs font-bold text-[#e9edef] border border-[#2a3942] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#00a8ff]" />
                    <span>{isAddingAdminWp ? 'Adding...' : 'Upload Image'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!adminWallpaperUrl.trim() || isAddingAdminWp}
                    onClick={() => handleAddAdminWp(adminWallpaperUrl)}
                    className="px-3.5 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] disabled:opacity-40 text-[#0b141a] text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={adminWallpaperUrl}
                  onChange={(e) => setAdminWallpaperUrl(e.target.value)}
                  placeholder="Or paste direct image URL for Admin Wallpaper..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#2a3942] bg-[#0b141a] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a8ff] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Clear Chat History Section */}
        <div>
          <h3 className="text-sm font-semibold text-[#8696a0] mb-3">Chat Management</h3>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear all chat history?')) {
                clearAllChatHistory();
                showSnack('All chat history cleared');
              }
            }}
            className="w-full p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Chat History</span>
          </button>
        </div>
      </div>

      {snack && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00a8ff] text-[#0b141a] px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-fade-in z-50">
          {snack}
        </div>
      )}

      {/* WhatsApp Full Live Wallpaper Preview Modal */}
      {showLiveWallpaperModal && (
        <SetChatWallpaperModal
          isOpen={showLiveWallpaperModal}
          onClose={() => setShowLiveWallpaperModal(false)}
          contactName="Chat Preview"
          contactAvatar={user?.avatar || authUser?.photoURL || undefined}
          isDark={isDark}
          currentWallpaper={vaultSettings?.chatWallpaper || 'default'}
          currentBlur={vaultSettings?.chatWallpaperBlur ?? 0}
          currentBrightness={vaultSettings?.chatWallpaperBrightness ?? 100}
          adminWallpapers={adminWallpapers}
          recentWallpapers={vaultSettings?.chatWallpaperRecent}
          favoriteWallpapers={vaultSettings?.chatWallpaperFavorites}
          customWallpapers={vaultSettings?.chatWallpaperCustomList}
          onApplyWallpaper={async (payload) => {
            updateVaultSettings({
              chatWallpaper: payload.wallpaper,
              chatWallpaperBlur: payload.blur,
              chatWallpaperBrightness: payload.brightness,
              chatWallpaperRecent: payload.recent,
              chatWallpaperFavorites: payload.favorites,
              chatWallpaperCustomList: payload.customList,
            });
            triggerSuccessOverlay('Wallpaper Set Successfully!');
          }}
          onResetWallpaper={async () => {
            updateVaultSettings({
              chatWallpaper: 'default',
              chatWallpaperBlur: 0,
              chatWallpaperBrightness: 100,
            });
            triggerSuccessOverlay('Wallpaper Reset Successfully!');
          }}
        />
      )}

      {/* Full Screen Checkmark Animation Overlay */}
      <WallpaperSuccessOverlay
        show={Boolean(fullScreenSuccessMsg)}
        message={fullScreenSuccessMsg || undefined}
        onClose={() => setFullScreenSuccessMsg(null)}
      />
    </div>
  );
};

/* ─── Main Settings View ──────────────────────────────────── */
export const VaultSettingsView: React.FC = () => {
  const { user, signOutGoogle, lockVault, settings: vaultSettings, updateSettings: updateVaultSettings } = useVault();
  const { settings, updateSettings, t } = useSettings();

  const [search, setSearch] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [subView, setSubView] = useState<null | 'history' | 'security' | 'chats'>(null);
  const [snack, setSnack] = useState('');

  const showSnack = (msg: string) => {
    setSnack(msg);
    setTimeout(() => setSnack(''), 3000);
  };

  // Render sub-views
  if (subView === 'history') return <HistoryView onBack={() => setSubView(null)} />;
  if (subView === 'security') return <VaultSecurityView onBack={() => setSubView(null)} />;
  if (subView === 'chats') return <ChatsSubView onBack={() => setSubView(null)} />;

  // avatar initials fallback
  const initials = (user.name || 'U').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    if (confirm('Sign out of your Google account?')) {
      await signOutGoogle();
      lockVault();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] h-full overflow-y-auto font-sans">

      {/* Search Bar */}
      <div className="px-4 py-3 bg-[#0b141a] sticky top-0 z-10">
        <div className="flex items-center gap-3 bg-[#1f2c34] rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-[#8696a0] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search settings"
            className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8696a0] text-[14.5px] focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-[#8696a0]" /></button>}
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer border-b border-[#1f2c34]/80">
        {/* Avatar */}
        <div className="relative shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#2a3942]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#6b7db3] flex items-center justify-center text-white text-xl font-bold border-2 border-[#2a3942]">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00a8ff] border-2 border-[#0b141a]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[16px] truncate">{user.name || 'User'}</p>
          <p className="text-[#8696a0] text-[13px] truncate">{user.email || user.status || 'Online'}</p>
        </div>

        <ChevronRight className="w-5 h-5 text-[#8696a0] shrink-0" />
      </div>

      {/* ── Section: Appearance ── */}
      <SectionDivider />
      <div className="bg-[#0b141a]">
        <MenuItem
          icon={<Globe className="w-5 h-5" />}
          label={t('language')}
          sub={LANGUAGES.find(l => l.code === settings.language)?.label || 'English'}
          onClick={() => setShowLanguageModal(true)}
        />

        <MenuItem
          icon={settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          label={t('darkMode')}
          sub={settings.darkMode ? 'Dark theme active' : 'Light theme active'}
          right={
            <Toggle
              on={settings.darkMode}
              onChange={() => updateSettings('darkMode', !settings.darkMode)}
            />
          }
        />

        <MenuItem
          icon={<Smartphone className="w-5 h-5" />}
          label="Phone Mockup Frame"
          sub={vaultSettings.showAndroidFrame ? 'AMOLED frame shown' : 'Full-screen mode'}
          right={
            <Toggle
              on={vaultSettings.showAndroidFrame}
              onChange={() => updateVaultSettings({ showAndroidFrame: !vaultSettings.showAndroidFrame })}
            />
          }
        />
      </div>

      {/* ── Section: History ── */}
      <SectionDivider />
      <div className="bg-[#0b141a]">
        <MenuItem
          icon={<History className="w-5 h-5" />}
          label={t('saveHistory')}
          sub={settings.saveHistory ? 'Calculations are being saved' : 'No calculations saved'}
          right={
            <Toggle
              on={settings.saveHistory}
              onChange={() => updateSettings('saveHistory', !settings.saveHistory)}
            />
          }
        />

        <MenuItem
          icon={<Eye className="w-5 h-5" />}
          label="View Calculation History"
          sub="Browse, export or delete records"
          onClick={() => setSubView('history')}
        />

        <MenuItem
          icon={<EyeOff className="w-5 h-5" />}
          label="Hide Chat Previews"
          sub={vaultSettings.hideChatHistory ? 'Previews disguised as system logs' : 'Normal preview text'}
          right={
            <Toggle
              on={vaultSettings.hideChatHistory}
              onChange={() => updateVaultSettings({ hideChatHistory: !vaultSettings.hideChatHistory })}
            />
          }
        />
      </div>

      {/* ── Section: Security ── */}
      <SectionDivider />
      <div className="bg-[#0b141a]">
        <MenuItem
          icon={<Key className="w-5 h-5" />}
          label="Vault Passcode & Security"
          sub={`Passcode: ${vaultSettings.passcode.replace(/./g, '●')} · Theme & Auto-lock`}
          onClick={() => setSubView('security')}
        />

        <MenuItem
          icon={<Shield className="w-5 h-5" />}
          label="Privacy"
          sub="Block contacts, disappearing messages"
          onClick={() => showSnack('Privacy settings coming soon')}
        />
      </div>

      {/* ── Section: Notifications ── */}
      <SectionDivider />
      <div className="bg-[#0b141a]">
        <MenuItem
          icon={<Bell className="w-5 h-5" />}
          label="Notifications"
          sub="Message, group & call tones"
          onClick={() => showSnack('Notification settings coming soon')}
        />

        <MenuItem
          icon={<MessageSquare className="w-5 h-5" />}
          label="Chats"
          sub="Theme, wallpapers, chat history"
          onClick={() => setSubView('chats')}
        />

        <MenuItem
          icon={<Star className="w-5 h-5" />}
          label="Starred Messages"
          sub="View all starred messages"
          onClick={() => showSnack('Starred messages coming soon')}
        />

        <MenuItem
          icon={<Keyboard className="w-5 h-5" />}
          label="Keyboard Shortcuts"
          sub="Quick actions from keyboard"
          onClick={() => showSnack('Keyboard shortcuts coming soon')}
        />
      </div>

      {/* ── Section: Support ── */}
      <SectionDivider />
      <div className="bg-[#0b141a]">
        <MenuItem
          icon={<HelpCircle className="w-5 h-5" />}
          label="Help and Feedback"
          sub="FAQs, contact us, privacy policy"
          onClick={() => showSnack('Help coming soon')}
        />
      </div>

      {/* ── Log Out ── */}
      <SectionDivider />
      <div className="bg-[#0b141a] pb-6">
        <MenuItem
          icon={<LogOut className="w-5 h-5" />}
          label="Log out"
          sub="Sign out of your account"
          onClick={handleSignOut}
          danger
          right={null}
        />
      </div>

      {/* Language Modal */}
      {showLanguageModal && (
        <LanguageModal
          current={settings.language}
          onSelect={code => updateSettings('language', code)}
          onClose={() => setShowLanguageModal(false)}
        />
      )}

      {/* Snackbar */}
      {snack && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1f2c34] border border-[#2a3942] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#00a8ff] shrink-0" />{snack}
        </div>
      )}
    </div>
  );
};
