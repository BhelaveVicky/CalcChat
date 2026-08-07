import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Image, Upload, Link, Check, RefreshCw, X, Palette, Sparkles, 
  Star, Sliders, Sun, Search, RotateCcw, Phone, Video, 
  MoreVertical, Smile, Paperclip, Mic, Send, ChevronLeft, CheckCheck
} from 'lucide-react';
import { compressImage } from '../lib/mediaCompressor';
import { GET_PRESET_WALLPAPERS, WallpaperPreset } from '../data/presetWalpapers';

export interface AdminWallpaperItem {
  id: string;
  name: string;
  url: string;
  color?: string;
}

export interface WallpaperApplyPayload {
  wallpaper: string;
  blur: number;
  brightness: number;
  recent?: string[];
  favorites?: string[];
  customList?: string[];
}

interface SetChatWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName?: string;
  contactAvatar?: string;
  isDark?: boolean;
  isAdmin?: boolean;
  currentWallpaper?: string;
  currentBlur?: number;
  currentBrightness?: number;
  adminWallpapers?: AdminWallpaperItem[];
  recentWallpapers?: string[];
  favoriteWallpapers?: string[];
  customWallpapers?: string[];
  onApplyWallpaper: (payload: WallpaperApplyPayload) => Promise<void> | void;
  onResetWallpaper: () => Promise<void> | void;
}

const SOLID_COLOR_SWATCHES: WallpaperPreset[] = [
  { id: 'solid_default', name: 'Default Doodle', bg: 'default', color: '#0b141a', isImage: false, category: 'Solid' },
  { id: 'solid_dark_charcoal', name: 'Dark Charcoal', bg: '#111b21', color: '#111b21', isImage: false, category: 'Solid' },
  { id: 'solid_slate', name: 'Deep Slate', bg: '#1e293b', color: '#1e293b', isImage: false, category: 'Solid' },
  { id: 'solid_emerald', name: 'WhatsApp Emerald', bg: '#075e54', color: '#075e54', isImage: false, category: 'Solid' },
  { id: 'solid_teal', name: 'Dark Teal', bg: '#0b2528', color: '#0b2528', isImage: false, category: 'Solid' },
  { id: 'solid_navy', name: 'Midnight Navy', bg: '#0d1b2a', color: '#0d1b2a', isImage: false, category: 'Solid' },
  { id: 'solid_plum', name: 'Plum Velvet', bg: '#2b102f', color: '#2b102f', isImage: false, category: 'Solid' },
  { id: 'solid_sunset', name: 'Sunset Crimson', bg: '#3a1c24', color: '#3a1c24', isImage: false, category: 'Solid' },
  { id: 'solid_cream', name: 'Classic Cream', bg: '#efeae2', color: '#efeae2', isImage: false, category: 'Solid' },
  { id: 'solid_mint', name: 'Pastel Mint', bg: '#d1e7dd', color: '#d1e7dd', isImage: false, category: 'Solid' },
  { id: 'solid_sky', name: 'Soft Sky', bg: '#cfe2ff', color: '#cfe2ff', isImage: false, category: 'Solid' },
  { id: 'solid_blush', name: 'Blush Rose', bg: '#f8d7da', color: '#f8d7da', isImage: false, category: 'Solid' },
];

export const SetChatWallpaperModal: React.FC<SetChatWallpaperModalProps> = ({
  isOpen,
  onClose,
  contactName = 'Chat Partner',
  contactAvatar,
  isDark = true,
  isAdmin = false,
  currentWallpaper = 'default',
  currentBlur = 0,
  currentBrightness = 100,
  adminWallpapers = [],
  recentWallpapers = [],
  favoriteWallpapers = [],
  customWallpapers = [],
  onApplyWallpaper,
  onResetWallpaper,
}) => {
  // Wallpaper state
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(currentWallpaper || 'default');
  const [blurValue, setBlurValue] = useState<number>(currentBlur ?? 0);
  const [brightnessValue, setBrightnessValue] = useState<number>(currentBrightness ?? 100);

  // Lists state
  const [favorites, setFavorites] = useState<string[]>(favoriteWallpapers || []);
  const [recents, setRecents] = useState<string[]>(recentWallpapers || []);
  const [customList, setCustomList] = useState<string[]>(customWallpapers || []);

  // UI State
  const [activeTab, setActiveTab] = useState<'all' | 'bright' | 'dark' | 'solid' | 'custom' | 'favorites' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const [showFullPreview, setShowFullPreview] = useState(false); // Mobile toggle for full screen chat preview

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state ONLY when modal opens (isOpen transitions from false to true)
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setSelectedWallpaper(currentWallpaper || 'default');
      setBlurValue(currentBlur ?? 0);
      setBrightnessValue(currentBrightness ?? 100);
      setFavorites(favoriteWallpapers || []);
      setRecents(recentWallpapers || []);
      setCustomList(customWallpapers || []);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentWallpaper, currentBlur, currentBrightness, favoriteWallpapers, recentWallpapers, customWallpapers]);

  // Combine built-in presets and admin wallpapers
  const allPresets = useMemo(() => {
    const builtIn = GET_PRESET_WALLPAPERS(isDark);
    const adminMapped: WallpaperPreset[] = adminWallpapers.map((a) => ({
      id: a.id,
      name: a.name,
      bg: a.url,
      color: a.color || '#1e293b',
      isImage: true,
      isAdminAdded: true,
      category: 'Dark',
    }));
    return [...builtIn, ...adminMapped];
  }, [isDark, adminWallpapers]);

  // Determine wallpaper style helpers
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

  // Favorite toggle handler
  const toggleFavorite = (wpUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(wpUrl) ? prev.filter(item => item !== wpUrl) : [...prev, wpUrl]
    );
  };

  // Image upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      alert('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const compressed = await compressImage(dataUrl, 1080, 300000);
        const finalUrl = compressed || dataUrl;
        setSelectedWallpaper(finalUrl);
        setCustomList(prev => prev.includes(finalUrl) ? prev : [finalUrl, ...prev]);
        setActiveTab('custom');
      } catch {
        setSelectedWallpaper(dataUrl);
        setCustomList(prev => prev.includes(dataUrl) ? prev : [dataUrl, ...prev]);
        setActiveTab('custom');
      } finally {
        setIsCompressing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Apply URL
  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const cleanUrl = urlInput.trim();
    setSelectedWallpaper(cleanUrl);
    setCustomList(prev => prev.includes(cleanUrl) ? prev : [cleanUrl, ...prev]);
    setUrlInput('');
  };

  // Apply wallpaper and close
  const handleSave = async () => {
    // Add to recent list
    const updatedRecents = [selectedWallpaper, ...recents.filter(r => r !== selectedWallpaper)].slice(0, 8);
    
    await onApplyWallpaper({
      wallpaper: selectedWallpaper,
      blur: blurValue,
      brightness: brightnessValue,
      recent: updatedRecents,
      favorites,
      customList,
    });
    onClose();
  };

  // Reset to default
  const handleReset = async () => {
    setSelectedWallpaper('default');
    setBlurValue(0);
    setBrightnessValue(100);
    await onResetWallpaper();
    onClose();
  };

  // Filter wallpapers based on search and tab selection
  const filteredWallpapers = useMemo(() => {
    let list: { id: string; name: string; bg: string; color?: string; isImage: boolean; category?: string }[] = [];

    if (activeTab === 'solid') {
      list = SOLID_COLOR_SWATCHES;
    } else if (activeTab === 'bright') {
      list = allPresets.filter(p => p.category === 'Bright' || p.category === 'Aesthetic & Art' || p.category === 'Cute & Anime');
    } else if (activeTab === 'dark') {
      list = allPresets.filter(p => p.category === 'Dark' || p.category === 'Minimal & Dark' || p.category === 'Texture & Neon');
    } else if (activeTab === 'custom') {
      list = customList.map((url, idx) => ({
        id: `custom_${idx}`,
        name: `Custom Image ${idx + 1}`,
        bg: url,
        isImage: true,
        category: 'Custom',
      }));
    } else if (activeTab === 'favorites') {
      list = favorites.map((fav, idx) => {
        const found = allPresets.find(p => p.bg === fav) || SOLID_COLOR_SWATCHES.find(s => s.bg === fav);
        return {
          id: `fav_${idx}`,
          name: found?.name || `Favorite ${idx + 1}`,
          bg: fav,
          isImage: fav.startsWith('data:') || fav.startsWith('http') || fav.startsWith('blob:'),
          category: 'Favorites',
        };
      });
    } else if (activeTab === 'recent') {
      list = recents.map((rec, idx) => {
        const found = allPresets.find(p => p.bg === rec) || SOLID_COLOR_SWATCHES.find(s => s.bg === rec);
        return {
          id: `rec_${idx}`,
          name: found?.name || `Recent ${idx + 1}`,
          bg: rec,
          isImage: rec.startsWith('data:') || rec.startsWith('http') || rec.startsWith('blob:'),
          category: 'Recent',
        };
      });
    } else {
      // 'all' tab
      list = [...SOLID_COLOR_SWATCHES, ...allPresets];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(q) || (item.category && item.category.toLowerCase().includes(q)));
    }

    return list;
  }, [activeTab, searchQuery, allPresets, customList, favorites, recents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in">
      <div 
        className={`w-full max-w-5xl rounded-2xl shadow-2xl border flex flex-col md:flex-row h-[94vh] max-h-[850px] overflow-hidden transition-all ${
          isDark 
            ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* ========================================================================= */}
        {/* LEFT / TOP PANEL: Full-Screen Authentic WhatsApp Live Chat Preview */}
        {/* ========================================================================= */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#2a3942] relative overflow-hidden bg-black/40">
          
          {/* Header Bar inside Preview */}
          <div className="px-3 py-2.5 bg-[#202c33] text-white flex items-center justify-between z-20 shadow-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <ChevronLeft className="w-5 h-5 text-[#00a8ff] cursor-pointer" />
              {contactAvatar ? (
                <img src={contactAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#00a8ff] text-[#0b141a] font-bold text-xs flex items-center justify-center">
                  {contactName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold text-xs leading-tight truncate">{contactName}</h4>
                <p className="text-[10px] text-emerald-400 font-medium">online</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <Video className="w-4 h-4 cursor-pointer hover:text-white" />
              <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
              <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* Main Chat Canvas with Layered Wallpaper Background */}
          <div className="relative flex-1 min-h-[220px] sm:min-h-[300px] overflow-hidden flex flex-col justify-between p-3">
            
            {/* Wallpaper Background Layer with Blur & Brightness */}
            <div 
              className="absolute inset-0 transition-all duration-200 bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{
                ...(isCustomImage ? {
                  backgroundImage: `url("${selectedWallpaper}")`,
                } : {}),
                ...(isCustomColor ? {
                  backgroundColor: selectedWallpaper,
                  backgroundImage: "url('/dark_blocks_bg.jpg')",
                  backgroundBlendMode: 'overlay',
                } : (!isCustomImage && isDark ? {
                  backgroundImage: "url('/dark_blocks_bg.jpg')",
                } : {
                  backgroundColor: isDark ? '#0b141a' : '#efeae2',
                })),
                filter: `blur(${blurValue}px) brightness(${brightnessValue}%)`,
                WebkitFilter: `blur(${blurValue}px) brightness(${brightnessValue}%)`,
                transform: blurValue > 0 ? 'scale(1.15)' : 'none',
              }}
            />

            {/* Chat Content Overlay (Unblurred Text & Bubbles) */}
            <div className="relative z-10 space-y-3 overflow-y-auto no-scrollbar my-auto">
              {/* Date Separator Pill */}
              <div className="flex justify-center my-1">
                <span className="px-3 py-0.5 rounded-lg bg-black/40 backdrop-blur-xs text-[10px] font-medium text-gray-200 border border-white/10 shadow-xs">
                  Today
                </span>
              </div>

              {/* Incoming Bubble 1 */}
              <div className="flex justify-start">
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl shadow-md border ${
                  isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-800'
                }`}>
                  <p className="text-xs font-sans leading-relaxed">
                    Hey! Tap any wallpaper to live preview how it looks in chat! 🎨
                  </p>
                  <span className="text-[9px] opacity-60 text-right block mt-0.5 font-sans">10:42 AM</span>
                </div>
              </div>

              {/* Outgoing Bubble 1 */}
              <div className="flex justify-end">
                <div className="max-w-[82%] px-3 py-2 rounded-2xl shadow-md bg-[#005c4b] text-white border border-emerald-600/30">
                  <p className="text-xs font-sans leading-relaxed">
                    This wallpaper looks awesome! The blur & brightness options are super smooth ✨
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px] text-emerald-200 font-sans">10:43 AM</span>
                    <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                  </div>
                </div>
              </div>

              {/* Incoming Bubble 2 */}
              <div className="flex justify-start">
                <div className={`max-w-[82%] px-3 py-1.5 rounded-2xl shadow-md border ${
                  isDark ? 'bg-[#202c33] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-800'
                }`}>
                  <p className="text-xs font-sans">Click "Apply Wallpaper" to save for all chats!</p>
                  <span className="text-[9px] opacity-60 text-right block mt-0.5 font-sans">10:44 AM</span>
                </div>
              </div>
            </div>

            {/* Input Bar inside Preview */}
            <div className="relative z-10 flex items-center gap-2 pt-2">
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-full border shadow-md ${
                isDark ? 'bg-[#202c33] border-[#2a3942] text-gray-300' : 'bg-white border-gray-200 text-gray-600'
              }`}>
                <Smile className="w-4 h-4 shrink-0 hover:text-[#00a8ff] cursor-pointer" />
                <input
                  disabled
                  readOnly
                  value="Type a message"
                  className="bg-transparent text-xs w-full focus:outline-hidden opacity-60 cursor-default"
                />
                <Paperclip className="w-4 h-4 shrink-0 hover:text-[#00a8ff] cursor-pointer" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00a8ff] text-[#0b141a] flex items-center justify-center shadow-md shrink-0">
                <Mic className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Bottom Live Controls Banner on Preview Side */}
          <div className="p-3 bg-[#111b21]/90 backdrop-blur-md border-t border-[#2a3942] z-20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00a8ff] animate-pulse" />
              <span className="font-semibold text-gray-200">Real-Time Live Preview</span>
            </div>
            <span className="text-[10px] text-gray-400">Updates instantly as you browse</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT / BOTTOM PANEL: Wallpaper Picker, Categories, Custom Upload & Sliders */}
        {/* ========================================================================= */}
        <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden bg-inherit">
          
          {/* Modal Header */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#00a8ff]/20 text-[#00a8ff]">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Chat Wallpaper</h3>
                <p className="text-xs opacity-70">
                  Select wallpaper for <span className="font-semibold text-[#00a8ff]">{contactName}</span>
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

          {/* Scrollable Picker & Settings Body */}
          <div className="p-4 overflow-y-auto space-y-4 no-scrollbar flex-1">
            
            {/* 1. Search Bar */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
              isDark ? 'bg-[#202c33] border-[#2a3942]' : 'bg-gray-100 border-gray-300'
            }`}>
              <Search className="w-4 h-4 opacity-60 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wallpapers by name or tag..."
                className="w-full bg-transparent focus:outline-hidden text-xs"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="opacity-60 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'bright', label: 'Bright' },
                { id: 'dark', label: 'Dark' },
                { id: 'solid', label: 'Solid Colors' },
                { id: 'custom', label: `Custom (${customList.length})` },
                { id: 'favorites', label: `Starred (${favorites.length})` },
                { id: 'recent', label: `Recent (${recents.length})` },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00a8ff] text-[#0b141a] shadow-md font-bold'
                        : isDark ? 'bg-[#202c33] text-gray-300 hover:bg-[#2a3942]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Sliders: Blur & Brightness Adjustment */}
            <div className={`p-3 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#182229] border-[#2a3942]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-[#00a8ff]">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Live Wallpaper Filters
                </span>
                <button 
                  type="button" 
                  onClick={() => { setBlurValue(0); setBrightnessValue(100); }}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 underline"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Blur Slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 opacity-80">
                    <span>Blur Effect</span>
                    <span className="font-mono font-bold text-[#00a8ff]">{blurValue}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={blurValue}
                    onChange={(e) => setBlurValue(parseFloat(e.target.value))}
                    className="w-full accent-[#00a8ff] cursor-pointer"
                  />
                </div>

                {/* Brightness Slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 opacity-80">
                    <span>Brightness / Dim</span>
                    <span className="font-mono font-bold text-[#00a8ff]">{brightnessValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={brightnessValue}
                    onChange={(e) => setBrightnessValue(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00a8ff] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 4. Custom Upload & URL option (Admin Only) */}
            {isAdmin && (
              <div className={`p-3 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#182229] border-[#2a3942]' : 'bg-gray-50 border-gray-200'
              }`}>
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#00a8ff]" /> Upload Custom Photo (Admin)
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#00a8ff]/15 hover:bg-[#00a8ff]/25 text-[#00a8ff] border border-[#00a8ff]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                    <span>{isCompressing ? 'Compressing Image...' : 'Upload Device Image (JPG/PNG/WEBP)'}</span>
                  </button>
                </div>

                {/* Paste URL */}
                <div className="flex gap-2 pt-1">
                  <div className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#111b21] border-[#2a3942]' : 'bg-white border-gray-300'
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
                    className="px-3 py-1.5 rounded-xl bg-[#00a8ff] text-[#0b141a] font-bold text-xs disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Load
                  </button>
                </div>
              </div>
            )}

            {/* 5. Wallpaper Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#00a8ff]" /> Select Wallpaper ({filteredWallpapers.length})
                </label>
              </div>

              {filteredWallpapers.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-60">
                  No wallpapers found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto no-scrollbar p-1">
                  {filteredWallpapers.map((item) => {
                    const isSelected = selectedWallpaper === item.bg || (item.bg === 'default' && selectedWallpaper === 'default');
                    const isFav = favorites.includes(item.bg);
                    const isLoaded = Boolean(imageLoadedMap[item.bg]);

                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedWallpaper(item.bg)}
                        className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden transition-all cursor-pointer group shadow-xs ${
                          isSelected
                            ? 'border-[#00a8ff] ring-2 ring-[#00a8ff]/40 scale-[1.02] z-10 shadow-lg'
                            : isDark ? 'border-[#2a3942] hover:border-gray-400' : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={
                          item.isImage
                            ? { backgroundImage: `url("${item.bg}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { backgroundColor: item.bg === 'default' ? (isDark ? '#0b141a' : '#efeae2') : (item.color || item.bg) }
                        }
                      >
                        {/* Hidden image preloader to detect load */}
                        {item.isImage && !isLoaded && (
                          <img
                            src={item.bg}
                            alt=""
                            className="hidden"
                            onLoad={() => setImageLoadedMap(prev => ({ ...prev, [item.bg]: true }))}
                          />
                        )}

                        {/* Skeleton loader overlay if image loading */}
                        {item.isImage && !isLoaded && (
                          <div className="absolute inset-0 bg-gray-700/50 animate-pulse flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-white/50 animate-spin" />
                          </div>
                        )}

                        {/* Checkmark overlay for selected item */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-[#00a8ff] text-[#0b141a] flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        )}

                        {/* Favorite star toggle button */}
                        {item.bg !== 'default' && (
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(item.bg, e)}
                            className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-md transition-all ${
                              isFav ? 'bg-amber-500/90 text-white' : 'bg-black/40 text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {/* Wallpaper Name Tag at bottom */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-white">
                          <p className="text-[10px] font-semibold truncate leading-tight">{item.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className={`p-4 border-t flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
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
                className="px-5 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply Wallpaper</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
