import React, { useState, useRef } from 'react';
import { Image, Upload, Link, Check, RefreshCw, X, Palette, Sparkles } from 'lucide-react';
import { compressImage } from '../lib/mediaCompressor';

interface AdminWallpaperItem {
  id: string;
  name: string;
  url: string;
}

interface SetChatWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar?: string;
  isDark: boolean;
  currentWallpaper: string;
  adminWallpapers?: AdminWallpaperItem[];
  onApplyWallpaper: (wallpaper: string) => Promise<void> | void;
  onResetWallpaper: () => Promise<void> | void;
}
const PRESET_SWATCHES = [
  { id: 'default', name: 'Default App Wallpaper', bg: 'default', color: '#111b21' },
  { id: 'dark_teal', name: 'Dark Teal', bg: '#0b141a', color: '#0b141a' },
  { id: 'whatsapp_dark', name: 'WhatsApp Dark', bg: '#111b21', color: '#111b21' },
  { id: 'emerald', name: 'Deep Emerald', bg: '#075e54', color: '#075e54' },
  { id: 'midnight', name: 'Midnight Navy', bg: '#0d1b2a', color: '#0d1b2a' },
  { id: 'plum', name: 'Plum Velvet', bg: '#2b102f', color: '#2b102f' },
  { id: 'sunset', name: 'Sunset Dusk', bg: '#3a1c24', color: '#3a1c24' },
  { id: 'slate', name: 'Charcoal Slate', bg: '#1e293b', color: '#1e293b' },
  { id: 'light_cream', name: 'Classic Cream', bg: '#efeae2', color: '#efeae2' },
  { id: 'mint', name: 'Pastel Mint', bg: '#d1e7dd', color: '#d1e7dd' },
  { id: 'sky', name: 'Soft Sky', bg: '#cfe2ff', color: '#cfe2ff' },
];

export const SetChatWallpaperModal: React.FC<SetChatWallpaperModalProps> = ({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
  isDark,
  currentWallpaper,
  adminWallpapers = [],
  onApplyWallpaper,
  onResetWallpaper,
}) => {
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(currentWallpaper || 'default');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isCustomImage = Boolean(
    selectedWallpaper && 
    selectedWallpaper !== 'default' && 
    (selectedWallpaper.startsWith('data:image/') || selectedWallpaper.startsWith('http://') || selectedWallpaper.startsWith('https://') || selectedWallpaper.startsWith('blob:'))
  );

  const isCustomColor = Boolean(
    selectedWallpaper && 
    selectedWallpaper !== 'default' && 
    (selectedWallpaper.startsWith('#') || selectedWallpaper.startsWith('rgb') || selectedWallpaper.startsWith('hsl'))
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const compressed = await compressImage(dataUrl, 1080, 350000);
        setSelectedWallpaper(compressed || dataUrl);
      } catch {
        setSelectedWallpaper(dataUrl);
      } finally {
        setIsCompressing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setSelectedWallpaper(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = async () => {
    await onApplyWallpaper(selectedWallpaper);
    onClose();
  };

  const handleReset = async () => {
    await onResetWallpaper();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden transition-all ${
          isDark 
            ? 'bg-[#1f2c34] border-[#2a3942] text-[#e9edef]' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00a8ff]/20 text-[#00a8ff]">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Set Chat Wallpaper</h3>
              <p className="text-xs opacity-75">
                Individual wallpaper for <span className="font-semibold text-[#00a8ff]">{contactName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#202c33] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-5 no-scrollbar flex-1">
          {/* 1. Live Interactive Chat Preview */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00a8ff]" />
              Live Wallpaper Preview
            </label>

            <div 
              className="relative w-full h-44 rounded-xl border overflow-hidden shadow-inner flex flex-col justify-between p-3"
              style={{
                ...(isCustomImage ? {
                  backgroundImage: `url("${selectedWallpaper}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                } : {}),
                ...(isCustomColor ? {
                  backgroundColor: selectedWallpaper,
                } : {
                  backgroundColor: isDark ? '#0b141a' : '#efeae2',
                }),
              }}
            >
              {/* Header preview badge */}
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs w-fit border border-white/10 shadow">
                {contactAvatar ? (
                  <img src={contactAvatar} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#00a8ff] text-[9px] font-bold flex items-center justify-center text-black">
                    {contactName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold truncate max-w-[120px]">{contactName}</span>
              </div>

              {/* Chat Message Bubbles */}
              <div className="space-y-2 text-xs">
                {/* Incoming Bubble */}
                <div className="flex justify-start">
                  <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl shadow-md ${
                    isDark ? 'bg-[#202c33] text-[#e9edef]' : 'bg-white text-gray-800'
                  }`}>
                    <p className="font-sans">Hey! How does this wallpaper look for our chat? 🎨</p>
                    <span className="text-[9px] opacity-60 text-right block mt-0.5">10:42 AM</span>
                  </div>
                </div>

                {/* Outgoing Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] px-3 py-1.5 rounded-2xl shadow-md bg-[#005c4b] text-white">
                    <p className="font-sans">Looks amazing! Custom set just for us ✨</p>
                    <span className="text-[9px] text-emerald-200 text-right block mt-0.5">10:43 AM ✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Custom Upload Section */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#00a8ff]" />
              Upload Custom Image
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                disabled={isCompressing}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#00a8ff]/15 hover:bg-[#00a8ff]/25 text-[#00a8ff] border border-[#00a8ff]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCompressing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
                <span>{isCompressing ? 'Processing Image...' : 'Choose Photo from Device'}</span>
              </button>
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                isDark ? 'bg-[#111b21] border-[#2a3942]' : 'bg-gray-100 border-gray-300'
              }`}>
                <Link className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full bg-transparent focus:outline-hidden text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-xs disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                Load
              </button>
            </div>
          </div>

          {/* 3. Preset Solid Colors & Themes */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#00a8ff]" />
              Preset Colors & Themes
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PRESET_SWATCHES.map((swatch) => {
                const isSelected = selectedWallpaper === swatch.bg || (swatch.bg === 'default' && selectedWallpaper === 'default');
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => setSelectedWallpaper(swatch.bg)}
                    className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00a8ff] ring-2 ring-[#00a8ff]/40 shadow-lg scale-102'
                        : isDark ? 'border-[#2a3942] hover:border-gray-500 bg-[#111b21]' : 'border-gray-200 hover:border-gray-400 bg-gray-50'
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-full border border-white/20 shadow-xs flex items-center justify-center"
                      style={{
                        backgroundColor: swatch.bg === 'default' ? (isDark ? '#0b141a' : '#efeae2') : swatch.color,
                      }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </div>
                    <span className="text-[10px] font-medium truncate max-w-full">{swatch.name}</span>
                  </button>
                );
              })}

              {/* Admin / Custom Global Wallpapers */}
              {adminWallpapers.map((wp) => {
                const isSelected = selectedWallpaper === wp.url;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setSelectedWallpaper(wp.url)}
                    className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00a8ff] ring-2 ring-[#00a8ff]/40 shadow-lg scale-102'
                        : isDark ? 'border-[#2a3942] hover:border-gray-500 bg-[#111b21]' : 'border-gray-200 hover:border-gray-400 bg-gray-50'
                    }`}
                  >
                    <img src={wp.url} alt={wp.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                    <span className="text-[10px] font-medium truncate max-w-full">{wp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer"
          >
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity cursor-pointer ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Set Wallpaper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
