import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  MessageSquare, CircleDashed, Phone, User, Settings, Lock, ShieldCheck,
  Smartphone, Plus, Users, Sparkles, MessageSquarePlus, ShieldAlert, KeyRound,
  ExternalLink, ChevronRight, ArrowLeft, Calculator as CalcIcon
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Calculator } from './Calculator';
import { WhatsAppTopBar } from './WhatsAppTopBar';
import { WhatsAppBottomBar } from './WhatsAppBottomBar';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { MediaGallery } from './MediaGallery';
import { UserProfileView } from './UserProfileView';
import { UserProfile } from './UserProfile';
import { VaultSettingsView } from './VaultSettingsView';
import { CallsView } from './CallsView';
import { CallModal } from './CallModal';
import { ActiveCallFloatingBanner } from './ActiveCallFloatingBanner';
import { GroupInviteModal } from './GrouplnviteModal';
import { SplashScreen } from './SplashScreen';
import { ErrorBoundary } from './ErrorBoundary';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';

export const VaultContainer: React.FC = () => {
  const {
    isUnlocked,
    activeTab,
    setActiveTab,
    activeContactId,
    setActiveContactId,
    settings: vaultSettings,
    updateSettings,
    lockVault,
    user,
    contacts,
    messages,
    statusUpdates,
    callLogs
  } = useVault();

  const navigate = useNavigate();
  const [showUnlockSplash, setShowUnlockSplash] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // References for touch gesture handling on mobile
  const containerRef = useRef<HTMLElement | null>(null);
  const activeTabRef = useRef(activeTab);
  const activeContactIdRef = useRef(activeContactId);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  // Native touch gesture listener attached directly to the main viewport container for mobile swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isValidGesture = false;

    const TAB_ORDER: Array<'chats' | 'gallery' | 'calls' | 'profile'> = ['chats', 'gallery', 'calls', 'profile'];

    const onTouchStart = (e: TouchEvent) => {
      // 1. Do not trigger section swipe if user is inside an active chat conversation on mobile
      if (activeContactIdRef.current) {
        isValidGesture = false;
        return;
      }

      const target = e.target as HTMLElement;

      // 2. Ignore ONLY text inputs, textareas, audio/video players, or active modal dialogs
      if (
        target.closest('input, textarea, select, audio, video, [role="dialog"], [role="slider"], .no-swipe') ||
        target.isContentEditable
      ) {
        isValidGesture = false;
        return;
      }

      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isValidGesture = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isValidGesture) return;
      isValidGesture = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // 3. Trigger swipe if horizontal movement >= 40px, horizontally dominant, and quick gesture (< 800ms)
      if (absX >= 40 && absX > absY * 1.2 && deltaTime < 800) {
        const currentTab = activeTabRef.current;
        const currentIndex = TAB_ORDER.indexOf(currentTab as any);

        if (currentIndex === -1) return;

        if (deltaX < 0) {
          // Swiped Left -> Next section
          if (currentIndex < TAB_ORDER.length - 1) {
            setActiveTab(TAB_ORDER[currentIndex + 1]);
          }
        } else {
          // Swiped Right -> Previous section
          if (currentIndex > 0) {
            setActiveTab(TAB_ORDER[currentIndex - 1]);
          }
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [setActiveTab]);

  useEffect(() => {
    if (isUnlocked) {
      setShowUnlockSplash(true);
      setIsFadingOut(false);

      let fadeTimer: NodeJS.Timeout;
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        fadeTimer = setTimeout(() => {
          setShowUnlockSplash(false);
        }, 500);
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (fadeTimer) clearTimeout(fadeTimer);
      };
    } else {
      setShowUnlockSplash(false);
      setIsFadingOut(false);
    }
  }, [isUnlocked]);

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (!isUnlocked) return <Calculator />;

  // Theme container classes
  let themeBg = isDark ? 'bg-[#0b141a] text-[#e9edef] font-sans' : 'bg-white text-gray-900 font-sans';
  if (isDark && vaultSettings.theme === 'amoled-black') themeBg = 'bg-black text-[#e9edef]';
  if (isDark && vaultSettings.theme === 'cyberpunk') themeBg = 'bg-purple-950 text-blue-100';
  if (isDark && vaultSettings.theme === 'emerald-vault') themeBg = 'bg-emerald-950 text-emerald-100';

  const isChatOpenOnMobile = activeTab === 'chats' && activeContactId;

  // Unread counts for desktop rail badges
  const totalUnreadMessages = (contacts || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unseenStatusCount = (statusUpdates || []).filter(s => s.userId !== user?.id && !s.seenUserIds?.includes(user?.id || '')).length;
  const missedCallsCount = (callLogs || []).filter(c => c.status === 'missed').length;

  return (
    <div className={`flex-1 flex w-full h-full max-w-full overflow-hidden relative select-none transition-colors duration-300 ${themeBg}`}>

      {/* Splash Screen overlay when unlocking the Hidden Chat / Vault */}
      {showUnlockSplash && <SplashScreen isFadingOut={isFadingOut} />}

      {/* ─── DESKTOP LEFT NAVIGATION RAIL (WhatsApp Web Style) ─── */}
      <aside
        className={`hidden md:flex flex-col items-center justify-between py-3.5 px-2 w-16 lg:w-18 shrink-0 border-r z-40 select-none transition-colors ${
          isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-[#f0f2f5] border-gray-200'
        }`}
      >
        {/* Top: Brand Logo & Navigation Icons */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Brand CC Logo */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('chats');
              setActiveContactId(null);
            }}
            className="p-1.5 rounded-2xl hover:scale-105 transition-transform cursor-pointer relative group"
            title="CalcChat Web"
          >
            <CCLogo className="w-8 h-8" />
          </button>

          <div className="w-8 h-[1px] bg-gray-500/20 my-0.5" />

          {/* Navigation Items */}
          <div className="flex flex-col items-center gap-2 w-full">
            {/* 1. Chats */}
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                activeTab === 'chats'
                  ? isDark
                    ? 'bg-[#202c33] text-[#00a8ff] shadow-md'
                    : 'bg-white text-[#00a8ff] shadow-sm font-bold'
                  : isDark
                  ? 'text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
              title="Chats"
            >
              <MessageSquare className="w-5 h-5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#00a8ff] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </button>

            {/* 2. Status / Stori */}
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? isDark
                    ? 'bg-[#202c33] text-[#00a8ff] shadow-md'
                    : 'bg-white text-[#00a8ff] shadow-sm font-bold'
                  : isDark
                  ? 'text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
              title="Status & Stories"
            >
              <CircleDashed className="w-5 h-5" />
              {unseenStatusCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#00a8ff] rounded-full ring-2 ring-[#111b21]" />
              )}
            </button>

            {/* 3. Calls */}
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? isDark
                    ? 'bg-[#202c33] text-[#00a8ff] shadow-md'
                    : 'bg-white text-[#00a8ff] shadow-sm font-bold'
                  : isDark
                  ? 'text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]'
                  : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
              title="Calls"
            >
              <Phone className="w-5 h-5" />
              {missedCallsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                  {missedCallsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom: Profile Avatar & Back to Calculator Button */}
        <div className="flex flex-col items-center gap-3 w-full pt-2">
          {/* User Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
              activeTab === 'profile'
                ? isDark
                  ? 'bg-[#202c33] ring-2 ring-[#00a8ff] shadow-md'
                  : 'bg-white ring-2 ring-[#00a8ff] shadow-sm'
                : isDark
                ? 'hover:bg-[#202c33]/60 hover:opacity-90'
                : 'hover:bg-gray-200/80 hover:opacity-90'
            }`}
            title="My Profile"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            )}
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#111b21]" />
          </button>

          {/* Back to Calculator Button */}
          <button
            type="button"
            onClick={lockVault}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 group ${
              isDark
                ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/80'
            }`}
            title="Back to Calculator"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT VIEWPORT (Full Desktop Width) ─── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header (Shown on Mobile screens when inside chat list/tabs) */}
        {!isChatOpenOnMobile && (
          <div className="md:hidden">
            <WhatsAppTopBar />
          </div>
        )}

        {/* Main Routing Container */}
        <main
          ref={containerRef}
          className="flex-1 flex flex-col overflow-hidden relative w-full h-full min-h-0 touch-pan-y"
        >
          <Routes>
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/profile" element={<UserProfile targetUserId="me" />} />
            <Route
              path="*"
              element={
                <>
                  {activeTab === 'chats' && (
                    <div className="flex-1 flex w-full h-full overflow-hidden">
                      {/* Left Column: ChatList */}
                      <div
                        className={`h-full border-r ${
                          isDark ? 'border-[#202c33] bg-[#111b21]' : 'border-gray-200 bg-white'
                        } ${
                          activeContactId
                            ? 'hidden md:flex md:w-80 lg:w-[380px] xl:w-[420px] 2xl:w-[460px] shrink-0'
                            : 'flex flex-1 md:flex-none md:w-80 lg:w-[380px] xl:w-[420px] 2xl:w-[460px] shrink-0'
                        } flex-col overflow-hidden`}
                      >
                        <ErrorBoundary>
                          <ChatList />
                        </ErrorBoundary>
                      </div>

                      {/* Right Column: ChatWindow OR Desktop Welcome Screen */}
                      <div
                        className={`h-full flex-1 ${
                          activeContactId ? 'flex' : 'hidden md:flex'
                        } flex-col overflow-hidden min-w-0`}
                      >
                        {activeContactId ? (
                          <ErrorBoundary>
                            <ChatWindow />
                          </ErrorBoundary>
                        ) : (
                          /* CalcChat Web Desktop Welcome Screen */
                          <div
                            className={`flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center select-none relative overflow-y-auto ${
                              isDark ? 'bg-[#0b141a] text-[#8696a0]' : 'bg-[#f0f2f5] text-gray-600'
                            }`}
                          >
                            <div className="max-w-md w-full flex flex-col items-center space-y-6 animate-fade-in">
                              {/* Central Animated Badge */}
                              <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#00a8ff]/20 to-[#0095f6]/10 border border-[#00a8ff]/30 flex items-center justify-center shadow-xl">
                                  <CCLogo className="w-14 h-14" />
                                </div>
                                <span className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full shadow-lg">
                                  <ShieldCheck className="w-4 h-4" />
                                </span>
                              </div>

                              {/* Title & Subtitle */}
                              <div>
                                <div className="mb-2 flex justify-center">
                                  <CalcChatTitle size="lg" />
                                </div>
                                <p className={`text-base font-medium mt-1 ${isDark ? 'text-[#e9edef]' : 'text-gray-800'}`}>
                                  CalcChat for Desktop & Web
                                </p>
                                <p className="text-xs sm:text-sm mt-2 leading-relaxed max-w-sm mx-auto">
                                  Send and receive end-to-end encrypted secret messages, voice notes, and media. Seamlessly protected behind a functional disguise calculator.
                                </p>
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const addBtn = document.getElementById('chatlist_new_chat_btn');
                                    if (addBtn) addBtn.click();
                                  }}
                                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer group ${
                                    isDark
                                      ? 'bg-[#111b21] border-[#202c33] hover:border-[#00a8ff]/50 hover:bg-[#182229]'
                                      : 'bg-white border-gray-200 hover:border-[#00a8ff]/50 hover:bg-gray-50 shadow-xs'
                                  }`}
                                >
                                  <div className="w-9 h-9 rounded-xl bg-[#00a8ff]/10 text-[#00a8ff] flex items-center justify-center shrink-0">
                                    <MessageSquarePlus className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`text-xs font-bold leading-tight ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                                      Start Chat
                                    </div>
                                    <div className="text-[11px] opacity-75 truncate">New secret chat</div>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const groupBtn = document.getElementById('chatlist_new_group_btn');
                                    if (groupBtn) groupBtn.click();
                                  }}
                                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer group ${
                                    isDark
                                      ? 'bg-[#111b21] border-[#202c33] hover:border-[#00a8ff]/50 hover:bg-[#182229]'
                                      : 'bg-white border-gray-200 hover:border-[#00a8ff]/50 hover:bg-gray-50 shadow-xs'
                                  }`}
                                >
                                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`text-xs font-bold leading-tight ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                                      New Group
                                    </div>
                                    <div className="text-[11px] opacity-75 truncate">Private group</div>
                                  </div>
                                </button>
                              </div>

                              {/* Encryption and Disguise Banner */}
                              <div
                                className={`w-full p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                                  isDark ? 'bg-[#111b21]/70 border-[#202c33]' : 'bg-white border-gray-200 shadow-xs'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 text-left">
                                  <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <div>
                                    <span className="font-semibold block leading-tight">Disguise Passcode Active</span>
                                    <span className="text-[10px] opacity-75">Type passcode= on calculator to unlock</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={lockVault}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Lock Now
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'gallery' && (
                    <div className="flex-1 w-full h-full overflow-hidden">
                      <MediaGallery />
                    </div>
                  )}

                  {activeTab === 'profile' && (
                    <div className="flex-1 w-full h-full overflow-hidden">
                      <UserProfileView />
                    </div>
                  )}

                  {activeTab === 'calls' && (
                    <div className="flex-1 w-full h-full overflow-hidden">
                      <CallsView />
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="flex-1 w-full h-full overflow-hidden">
                      <VaultSettingsView />
                    </div>
                  )}
                </>
              }
            />
          </Routes>
        </main>

        {/* Bottom Navigation (Shown ONLY on mobile when inside main tab view) */}
        {!isChatOpenOnMobile && (
          <div className="md:hidden">
            <WhatsAppBottomBar />
          </div>
        )}
      </div>

      {/* Floating Active Call Banner */}
      <ActiveCallFloatingBanner />

      {/* Global Call Screen Overlay */}
      <CallModal />

      {/* Global Group Invite Preview & Join Modal */}
      <GroupInviteModal onSelectGroup={(gId) => setActiveContactId(gId)} />
    </div>
  );
};

