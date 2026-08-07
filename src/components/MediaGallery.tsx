import React, { useState, useEffect } from 'react';
import { 
  Plus, Camera, Eye, Download, Shield, Upload, FileText, Video, Image as ImageIcon, X, Send, Lock, 
  ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, MoreVertical, Pencil, Type, Palette, 
  Smile, Trash2, ShieldCheck, Check, ChevronDown, Share2, Sparkles, Heart, EyeOff, RotateCw,
  Move, ZoomIn, ZoomOut, Sliders, RefreshCw, Maximize2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Loader2
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { StatusUpdate } from '../types';
import { StatusCard } from './Status/StatusCard';
import { StatusViewer } from './Status/StatusViewer';
import { compressImage } from '../lib/mediaCompressor';

export interface StatusSlide {
  id: string;
  image?: string;
  text?: string;
  bgColor?: string;
  time: string;
  caption?: string;
  viewsCount?: number;
  viewers?: { name: string; avatar: string; time: string }[];
  filter?: string;
  rotation?: number;
  zoom?: number;
  positionX?: number;
  positionY?: number;
  fitMode?: 'cover' | 'contain' | 'fill';
  photoTextOverlay?: string;
  photoTextColor?: string;
  canvasBg?: string;
  privacySetting?: 'contacts' | 'except' | 'only' | 'private';
  privacyContacts?: string[];
}

export interface StatusUser {
  id: string;
  name: string;
  time: string;
  avatar: string;
  isViewed?: boolean;
  isMuted?: boolean;
  slides: StatusSlide[];
}

export const MediaGallery: React.FC = () => {
  const { 
    sendMessage, contacts, user, authUser, settings: vaultSettings,
    statusUpdates, postStatusUpdate, reshareStatus, deleteStatusUpdate, likeStatusUpdate,
    markStatusAsSeen, replyToStatus, reactToStatus, getSeenRecords, getLikeRecords,
    activeMentionNotification, dismissMentionNotification, openMentionedStatus, setActiveTab
  } = useVault();

  // Selected Status Viewer group index
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);

  // Mention Suggestions State
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionedUsernames, setMentionedUsernames] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  // State for Privacy Settings (persisted in localStorage)
  const [privacySetting, setPrivacySetting] = useState<'contacts' | 'only'>(() => {
    try {
      const saved = localStorage.getItem('status_privacy_setting');
      return (saved === 'only' || saved === 'contacts') ? saved : 'contacts';
    } catch {
      return 'contacts';
    }
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedPrivacyContactIds, setSelectedPrivacyContactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('status_privacy_contact_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [privacySearchQuery, setPrivacySearchQuery] = useState('');
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('status_privacy_setting', privacySetting);
      localStorage.setItem('status_privacy_contact_ids', JSON.stringify(selectedPrivacyContactIds));
    } catch (e) {
      console.warn('Error saving privacy setting:', e);
    }
  }, [privacySetting, selectedPrivacyContactIds]);

  const availableContacts = contacts.filter(c => !c.isGroup && !c.isSelf);

  const togglePrivacyContact = (contactId: string) => {
    setSelectedPrivacyContactIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const getPrivacyLabel = () => {
    if (privacySetting === 'contacts') return 'My all contacts';
    if (privacySetting === 'only') {
      return selectedPrivacyContactIds.length > 0 
        ? `Only (${selectedPrivacyContactIds.length})` 
        : 'Only share with...';
    }
    return 'My all contacts';
  };

  // State for Creator Studio (Text or Image/Video Status)
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorType, setCreatorType] = useState<'text' | 'media'>('text');
  const [creatorMediaType, setCreatorMediaType] = useState<'image' | 'video'>('image');
  const [statusText, setStatusText] = useState('');
  const [statusBgColor, setStatusBgColor] = useState('from-[#00a8ff] to-[#0284c7]');
  const [statusCaption, setStatusCaption] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'normal' | 'vintage' | 'mono' | 'cyber' | 'warm' | 'dramatic'>('normal');

  // Photo Custom Position & Editing States
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [photoZoom, setPhotoZoom] = useState<number>(1);
  const [photoPositionX, setPhotoPositionX] = useState<number>(0);
  const [photoPositionY, setPhotoPositionY] = useState<number>(0);
  const [photoFitMode, setPhotoFitMode] = useState<'cover' | 'contain' | 'fill'>('contain');
  const [photoTextOverlay, setPhotoTextOverlay] = useState<string>('');
  const [photoTextColor, setPhotoTextColor] = useState<string>('#ffffff');
  const [photoCanvasBg, setPhotoCanvasBg] = useState<string>('#000000');
  const [activePhotoTool, setActivePhotoTool] = useState<'adjust' | 'filter' | 'text' | 'bg'>('adjust');

  const resetPhotoEditor = () => {
    setPhotoRotation(0);
    setPhotoZoom(1);
    setPhotoPositionX(0);
    setPhotoPositionY(0);
    setPhotoFitMode('contain');
    setPhotoTextOverlay('');
    setPhotoTextColor('#ffffff');
    setPhotoCanvasBg('#000000');
    setSelectedFilter('normal');
    setActivePhotoTool('adjust');
  };

  // Muted updates toggle
  const [showMutedSection, setShowMutedSection] = useState(false);

  // My Status slides state (persistently initialized with default and user additions)
  const [mySlides, setMySlides] = useState<StatusSlide[]>([
    {
      id: 'my_slide_1',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      time: 'Today at 10:15 am',
      caption: 'Secured status update 🔒',
      viewsCount: 14,
      viewers: [
        { name: 'प्रकाश भोंगाडे', avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300&auto=format&fit=crop&q=80', time: '10:20 am' },
        { name: 'Ishant Pandhre', avatar: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&auto=format&fit=crop&q=80', time: '10:32 am' },
        { name: 'harsh meshram', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80', time: '11:05 am' }
      ]
    }
  ]);

  // Contacts Status List State
  const [contactsStatus, setContactsStatus] = useState<StatusUser[]>([
    {
      id: 's0',
      name: 'प्रकाश भोंगाडे',
      time: 'Today at 11:54 am',
      avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300&auto=format&fit=crop&q=80',
      isViewed: false,
      slides: [
        {
          id: 'pb_1',
          image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
          time: 'Today at 11:54 am',
          caption: 'Family gathering & celebrations 🌸'
        },
        {
          id: 'pb_2',
          image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
          time: 'Today at 11:50 am',
          caption: 'Beautiful morning vibes ☀️'
        }
      ]
    },
    {
      id: 's1',
      name: 'Unkaun Number',
      time: 'Today at 9:20 am',
      avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
      isViewed: false,
      slides: [
        {
          id: 'un_1',
          image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
          time: 'Today at 9:20 am'
        }
      ]
    },
    {
      id: 's2',
      name: 'Ishant Pandhre',
      time: 'Today at 9:13 am',
      avatar: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&auto=format&fit=crop&q=80',
      isViewed: false,
      slides: [
        {
          id: 'ip_1',
          image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
          time: 'Today at 9:13 am'
        }
      ]
    },
    {
      id: 's3',
      name: 'Ashwani Yadav Sir',
      time: 'Yesterday at 9:10 pm',
      avatar: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80',
      isViewed: true,
      slides: [
        {
          id: 'ay_1',
          image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
          time: 'Yesterday at 9:10 pm'
        }
      ]
    },
    {
      id: 's4',
      name: 'निरूता डोंगरवार',
      time: 'Yesterday at 6:45 pm',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      isViewed: true,
      isMuted: true,
      slides: [
        {
          id: 'nd_1',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          time: 'Yesterday at 6:45 pm'
        }
      ]
    }
  ]);

  // Active Story Viewer State
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null); // -1 = My Status, null = none, 0..N = contacts
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [replyText, setReplyText] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [reactionBubble, setReactionBubble] = useState<string | null>(null);

  const activeUser: StatusUser | null = activeUserIndex === -1 
    ? {
        id: 'my',
        name: 'My Status',
        time: mySlides[mySlides.length - 1]?.time || 'Just now',
        avatar: user.avatar,
        slides: mySlides
      }
    : (activeUserIndex !== null ? contactsStatus[activeUserIndex] : null);

  const activeSlide: StatusSlide | null = activeUser?.slides[currentSlideIndex] || null;

  // Auto-play timer for active story
  useEffect(() => {
    if (activeUserIndex === null || !activeUser || isPaused) return;

    const intervalTime = 50;
    const increment = (intervalTime / 5000) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeUserIndex, currentSlideIndex, isPaused, activeUser]);

  // Mark status as viewed when opened
  useEffect(() => {
    if (activeUserIndex !== null && activeUserIndex >= 0) {
      setContactsStatus((prev) => 
        prev.map((item, idx) => idx === activeUserIndex ? { ...item, isViewed: true } : item)
      );
    }
  }, [activeUserIndex]);

  // Navigation handlers
  const handleNextSlide = () => {
    if (!activeUser) return;

    if (currentSlideIndex < activeUser.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      if (activeUserIndex === -1) {
        if (contactsStatus.length > 0) {
          setActiveUserIndex(0);
          setCurrentSlideIndex(0);
          setProgress(0);
        } else {
          closeStoryViewer();
        }
      } else if (activeUserIndex !== null && activeUserIndex < contactsStatus.length - 1) {
        setActiveUserIndex(activeUserIndex + 1);
        setCurrentSlideIndex(0);
        setProgress(0);
      } else {
        closeStoryViewer();
      }
    }
  };

  const handlePrevSlide = () => {
    if (!activeUser) return;

    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      if (activeUserIndex !== null && activeUserIndex > 0) {
        const prevIdx = activeUserIndex - 1;
        setActiveUserIndex(prevIdx);
        setCurrentSlideIndex(contactsStatus[prevIdx].slides.length - 1);
        setProgress(0);
      } else if (activeUserIndex === 0) {
        setActiveUserIndex(-1);
        setCurrentSlideIndex(mySlides.length - 1);
        setProgress(0);
      } else {
        closeStoryViewer();
      }
    }
  };

  const closeStoryViewer = () => {
    setActiveUserIndex(null);
    setCurrentSlideIndex(0);
    setProgress(0);
    setIsPaused(false);
    setShowViewersSheet(false);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeUserIndex === null) return;
      if (e.key === 'ArrowRight') handleNextSlide();
      if (e.key === 'ArrowLeft') handlePrevSlide();
      if (e.key === 'Escape') closeStoryViewer();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeUserIndex, currentSlideIndex, activeUser]);

  // Send Reply directly into contact chat
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeUser) return;
    const targetChannel = contacts[0]?.id || 'contact_novak';
    sendMessage(targetChannel, `Replied to status: "${replyText}"`);
    setReplyText('');
    closeStoryViewer();
  };

  // Send Reaction
  const handleSendReaction = (emoji: string) => {
    setReactionBubble(emoji);
    setTimeout(() => setReactionBubble(null), 1200);
    if (activeUser && activeUser.id !== 'my') {
      const targetChannel = contacts[0]?.id || 'contact_novak';
      sendMessage(targetChannel, `Reacted ${emoji} to status`);
    }
  };

  // Add new status from file picker or creator (supports images and videos <= 60s)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type || '';

    // Handle Video Upload
    if (fileType.startsWith('video/')) {
      const tempObjUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = tempObjUrl;

      tempVideo.onloadedmetadata = () => {
        const durationSec = tempVideo.duration;
        URL.revokeObjectURL(tempObjUrl);

        // Validation: Maximum 60 seconds (1 minute) video allowed
        if (durationSec > 60.5) {
          setPrivacyToast('⚠️ Video duration must be 60 seconds (1 minute) or less!');
          setTimeout(() => setPrivacyToast(null), 4500);
          e.target.value = '';
          return;
        }

        // Check file size (e.g., max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          setPrivacyToast('⚠️ Video file size is too large (max 15MB)');
          setTimeout(() => setPrivacyToast(null), 4000);
          e.target.value = '';
          return;
        }

        setPrivacyToast('Processing video status...');
        const reader = new FileReader();
        reader.onload = (event) => {
          const resultUrl = event.target?.result as string;
          if (resultUrl) {
            setSelectedMediaUrl(resultUrl);
            setCreatorMediaType('video');
            setCreatorType('media');
            resetPhotoEditor();
            setShowCreatorModal(true);
            setPrivacyToast(null);
          }
        };
        reader.onerror = () => {
          setPrivacyToast('⚠️ Failed to process video file');
          setTimeout(() => setPrivacyToast(null), 3000);
        };
        reader.readAsDataURL(file);
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(tempObjUrl);
        setPrivacyToast('⚠️ Failed to load video. Format may not be supported.');
        setTimeout(() => setPrivacyToast(null), 4000);
        e.target.value = '';
      };
    } else {
      // Handle Image Upload
      const reader = new FileReader();
      reader.onload = async (event) => {
        let rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          if (rawDataUrl.length > 350000) {
            try {
              const compressed = await compressImage(rawDataUrl, 1080, 350000);
              if (compressed) rawDataUrl = compressed;
            } catch (err) {
              console.warn('Image compression error:', err);
            }
          }
          setSelectedMediaUrl(rawDataUrl);
          setCreatorMediaType('image');
          setCreatorType('media');
          resetPhotoEditor();
          setShowCreatorModal(true);
        }
      };
      reader.onerror = () => {
        setPrivacyToast('⚠️ Failed to process image file');
        setTimeout(() => setPrivacyToast(null), 3000);
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  // Real-time Firestore Status Groups
  const myStatuses = statusUpdates.filter(s => authUser && s.userId === authUser.uid);
  const myGroup = {
    userId: authUser?.uid || 'me',
    userName: user.name || authUser?.displayName || 'My Status',
    userAvatar: user.avatar || authUser?.photoURL || '',
    statuses: myStatuses,
    hasUnviewed: false,
    latestCreatedAt: myStatuses[0]?.createdAt,
  };

  const otherUsersMap = new Map<string, StatusUpdate[]>();
  statusUpdates.forEach(s => {
    if (authUser && s.userId !== authUser.uid) {
      if (!otherUsersMap.has(s.userId)) {
        otherUsersMap.set(s.userId, []);
      }
      otherUsersMap.get(s.userId)!.push(s);
    }
  });

  const friendGroups: {
    userId: string;
    userName: string;
    userAvatar: string;
    statuses: StatusUpdate[];
    hasUnviewed: boolean;
    latestCreatedAt: any;
  }[] = [];

  otherUsersMap.forEach((statuses, uId) => {
    const firstStatus = statuses[0];
    const hasUnviewed = statuses.some(s => authUser && (!s.seenUserIds || !s.seenUserIds.includes(authUser.uid)));
    friendGroups.push({
      userId: uId,
      userName: firstStatus.userName || 'Friend',
      userAvatar: firstStatus.userAvatar || '',
      statuses,
      hasUnviewed,
      latestCreatedAt: firstStatus.createdAt,
    });
  });

  const recentFriendGroups = friendGroups.filter(g => g.hasUnviewed);
  const viewedFriendGroups = friendGroups.filter(g => !g.hasUnviewed);

  const allViewerGroups = [
    myGroup,
    ...friendGroups
  ].filter(g => g.statuses.length > 0);

  const handleStatusTextOrCaptionChange = (val: string, isTextStatus: boolean) => {
    if (isTextStatus) setStatusText(val);
    else setStatusCaption(val);

    const match = val.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMentionContact = (contact: Contact, isTextStatus: boolean) => {
    const rawUsername = contact.username || contact.name.toLowerCase().replace(/\s+/g, '');
    const usernameTag = `@${rawUsername}`;

    if (isTextStatus) {
      setStatusText((prev) => prev.replace(/@\w*$/, '').trim());
    } else {
      setStatusCaption((prev) => prev.replace(/@\w*$/, '').trim());
    }

    if (!mentionedUserIds.includes(contact.id)) {
      setMentionedUserIds((prev) => [...prev, contact.id]);
    }
    if (!mentionedUsernames.includes(usernameTag)) {
      setMentionedUsernames((prev) => [...prev, usernameTag]);
    }

    setShowMentionSuggestions(false);
  };

  const handlePublishStatus = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      if (privacySetting === 'only' && selectedPrivacyContactIds.length === 0) {
        setPrivacyToast('⚠️ Select at least 1 contact in Status Privacy');
        setShowPrivacyModal(true);
        setTimeout(() => setPrivacyToast(null), 3000);
        setIsPublishing(false);
        return;
      }

      if (creatorType === 'text') {
        if (!statusText.trim()) {
          setIsPublishing(false);
          return;
        }
        await postStatusUpdate(
          statusText,
          '',
          'image',
          statusCaption,
          statusBgColor,
          privacySetting,
          selectedPrivacyContactIds,
          mentionedUsernames,
          mentionedUserIds
        );
      } else {
        if (!selectedMediaUrl) {
          setIsPublishing(false);
          return;
        }

        let finalMediaUrl = selectedMediaUrl;
        const mediaKind = creatorMediaType;

        if (mediaKind === 'image' && finalMediaUrl.length > 350000) {
          try {
            const compressed = await compressImage(finalMediaUrl, 1080, 350000);
            if (compressed) finalMediaUrl = compressed;
          } catch (e) {
            console.warn('Image compression warning on publish:', e);
          }
        }

        await postStatusUpdate(
          statusCaption || (mediaKind === 'video' ? 'Video status' : 'Status update'),
          finalMediaUrl,
          mediaKind,
          statusCaption,
          '#ea4c89',
          privacySetting,
          selectedPrivacyContactIds,
          mentionedUsernames,
          mentionedUserIds
        );
      }

      setShowCreatorModal(false);
      setStatusText('');
      setStatusCaption('');
      setSelectedMediaUrl(null);
      setMentionedUserIds([]);
      setMentionedUsernames([]);
      setShowMentionSuggestions(false);
      resetPhotoEditor();

      const label = getPrivacyLabel();
      setPrivacyToast(`Status uploaded (${label})`);
      setTimeout(() => setPrivacyToast(null), 3500);
    } catch (err) {
      console.error('Failed to post status:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleMute = (statusId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactsStatus((prev) => 
      prev.map((c) => c.id === statusId ? { ...c, isMuted: !c.isMuted } : c)
    );
  };

  const handleDeleteMySlide = (slideId: string) => {
    setMySlides((prev) => prev.filter((s) => s.id !== slideId));
    if (mySlides.length <= 1) {
      closeStoryViewer();
    } else {
      setCurrentSlideIndex(0);
    }
  };

  const unreadStatuses = contactsStatus.filter((s) => !s.isViewed && !s.isMuted);
  const viewedStatuses = contactsStatus.filter((s) => s.isViewed && !s.isMuted);
  const mutedStatuses = contactsStatus.filter((s) => s.isMuted);

  const bgColorsList = [
    'from-[#00a8ff] to-[#0284c7]',
    'from-purple-600 to-indigo-800',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-700',
    'from-blue-600 to-cyan-800',
    'from-[#202c33] to-[#111b21]'
  ];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${
      isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-gray-50 text-gray-900'
    } select-none relative`}>
      
      {/* Top Title Bar */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isDark ? 'border-[#202c33] bg-[#111b21]' : 'border-gray-200 bg-white'
      } sticky top-0 z-20`}>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">Status</h2>
          <span className="bg-[#00a8ff]/20 text-[#00a8ff] text-xs font-semibold px-2 py-0.5 rounded-full">
            Encrypted
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-[#202c33] text-[#8596a0]' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Status Privacy"
          >
            <ShieldCheck className="w-5 h-5 text-[#00a8ff]" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* My Status Card */}
        <StatusCard
          statusGroup={myGroup}
          isSelf={true}
          isDark={isDark}
          onClick={() => {
            if (myStatuses.length > 0) {
              setSelectedGroupIndex(0);
            } else {
              setCreatorType('text');
              setShowCreatorModal(true);
            }
          }}
          onAddStatus={() => {
            setCreatorType('text');
            setShowCreatorModal(true);
          }}
        />

        {/* Section: Recent Updates */}
        {recentFriendGroups.length > 0 && (
          <div className="space-y-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider px-1 ${
              isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
              Recent updates ({recentFriendGroups.length})
            </h4>
            <div className="space-y-1">
              {recentFriendGroups.map((group) => {
                const groupIdx = allViewerGroups.findIndex(g => g.userId === group.userId);
                return (
                  <StatusCard
                    key={group.userId}
                    statusGroup={group}
                    isDark={isDark}
                    onClick={() => {
                      if (groupIdx !== -1) setSelectedGroupIndex(groupIdx);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Section: Viewed Updates */}
        {viewedFriendGroups.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider px-1 ${
              isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
              Viewed updates ({viewedFriendGroups.length})
            </h4>
            <div className="space-y-1">
              {viewedFriendGroups.map((group) => {
                const groupIdx = allViewerGroups.findIndex(g => g.userId === group.userId);
                return (
                  <StatusCard
                    key={group.userId}
                    statusGroup={group}
                    isDark={isDark}
                    onClick={() => {
                      if (groupIdx !== -1) setSelectedGroupIndex(groupIdx);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Floating Action Buttons for Quick Create on Mobile */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setCreatorType('text');
            setShowCreatorModal(true);
          }}
          className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 ${
            isDark ? 'bg-[#202c33] text-[#e9edef] border border-[#2a3942]' : 'bg-white text-gray-700 border border-gray-200'
          }`}
          title="Create text status"
        >
          <Pencil className="w-5 h-5" />
        </button>

        <label 
          className="w-13 h-13 rounded-2xl bg-[#00a8ff] text-[#0b141a] shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-90 border border-[#00a8ff]/40"
          title="Upload image / video"
        >
          <Camera className="w-6 h-6 stroke-[2.2]" />
          <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Real-time Firestore Status Viewer Modal */}
      {selectedGroupIndex !== null && allViewerGroups[selectedGroupIndex] && (
        <StatusViewer
          statusGroups={allViewerGroups}
          initialGroupIndex={selectedGroupIndex}
          currentUserId={authUser?.uid || 'me'}
          currentUserName={user.name || authUser?.displayName || 'Me'}
          currentUserAvatar={user.avatar || authUser?.photoURL || ''}
          onClose={() => setSelectedGroupIndex(null)}
          onLikeStatus={likeStatusUpdate}
          onMarkSeen={markStatusAsSeen}
          onSendReply={replyToStatus}
          onSendReaction={reactToStatus}
          onDeleteStatus={deleteStatusUpdate}
          onReshareStatus={reshareStatus}
          getSeenRecords={getSeenRecords}
          getLikeRecords={getLikeRecords}
          isDark={isDark}
        />
      )}

      {/* Creator Studio Modal (Text / Media Status Creation & Photo Editor) */}
      {showCreatorModal && (
        <div className="fixed inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-4 text-white animate-fade-in overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between z-10 py-1">
            <button
              type="button"
              onClick={() => {
                setShowCreatorModal(false);
                setSelectedMediaUrl(null);
                resetPhotoEditor();
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {creatorType === 'media' && (
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00a8ff]" />
                <span>{creatorMediaType === 'video' ? 'Video Status Studio' : 'Photo Editor & Positioning'}</span>
              </h3>
            )}

            <div className="flex items-center gap-2">
              {creatorType === 'text' && (
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full">
                  {bgColorsList.map((bg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStatusBgColor(bg)}
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${bg} border-2 ${
                        statusBgColor === bg ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}

              {creatorType === 'media' && (
                <button
                  type="button"
                  onClick={resetPhotoEditor}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold flex items-center gap-1 text-gray-200 transition-colors"
                  title="Reset image modifications"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Workspace Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 my-auto">
            {creatorType === 'text' ? (
              <div className={`w-full max-w-md h-80 rounded-3xl bg-gradient-to-br ${statusBgColor} p-6 flex items-center justify-center shadow-2xl`}>
                <textarea
                  placeholder="Type a status... Use @username to mention friends"
                  value={statusText}
                  onChange={(e) => handleStatusTextOrCaptionChange(e.target.value, true)}
                  className="w-full bg-transparent text-center text-2xl font-bold text-white placeholder-white/60 focus:outline-none resize-none"
                  rows={4}
                  maxLength={200}
                />
              </div>
            ) : (
              <div className="w-full max-w-md flex flex-col items-center gap-3">
                {/* Live Photo / Video Workspace Canvas Frame */}
                <div 
                  className="relative w-full h-[45vh] sm:h-[52vh] max-h-[520px] rounded-2xl overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl transition-all relative bg-black"
                  style={{ backgroundColor: photoCanvasBg }}
                >
                  {creatorMediaType === 'video' && selectedMediaUrl ? (
                    <div className="w-full h-full flex items-center justify-center relative p-1 bg-black">
                      <video
                        src={selectedMediaUrl}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-full max-w-full rounded-xl object-contain mx-auto shadow-2xl"
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-cyan-400 border border-cyan-500/40 flex items-center gap-1.5 shadow-md">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Status (≤ 60s)</span>
                      </div>
                    </div>
                  ) : selectedMediaUrl ? (
                    <img 
                      src={selectedMediaUrl} 
                      alt="Status Preview" 
                      className={`transition-all duration-150 select-none ${
                        selectedFilter === 'vintage' ? 'sepia contrast-125' :
                        selectedFilter === 'mono' ? 'grayscale' :
                        selectedFilter === 'cyber' ? 'hue-rotate-90 saturate-200' :
                        selectedFilter === 'warm' ? 'brightness-105 saturate-150' :
                        selectedFilter === 'dramatic' ? 'contrast-150 brightness-90' : ''
                      }`}
                      style={{
                        transform: `rotate(${photoRotation}deg) scale(${photoZoom}) translate(${photoPositionX}px, ${photoPositionY}px)`,
                        objectFit: photoFitMode,
                        maxHeight: '100%',
                        maxWidth: '100%',
                        width: photoFitMode === 'cover' || photoFitMode === 'fill' ? '100%' : 'auto',
                        height: photoFitMode === 'cover' || photoFitMode === 'fill' ? '100%' : 'auto',
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                      <ImageIcon className="w-12 h-12 stroke-1" />
                      <p className="text-sm">Select media to preview</p>
                    </div>
                  )}

                  {/* Text Overlay on Canvas (For Image Status) */}
                  {creatorMediaType === 'image' && photoTextOverlay && (
                    <div 
                      className="absolute z-20 px-4 py-2 rounded-xl backdrop-blur-md bg-black/50 font-bold text-center max-w-[85%] shadow-lg drop-shadow border border-white/20 pointer-events-none"
                      style={{ color: photoTextColor }}
                    >
                      {photoTextOverlay}
                    </div>
                  )}


                </div>

                {/* Photo Editor Tabs & Toolbar (Only shown for images) */}
                {creatorMediaType === 'image' && (
                <div className="w-full bg-[#111b21] border border-[#202c33] rounded-2xl p-3 space-y-3 shadow-xl">
                  {/* Tool Category Selector */}
                  <div className="flex items-center justify-around border-b border-[#202c33] pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setActivePhotoTool('adjust')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                        activePhotoTool === 'adjust' ? 'bg-[#00a8ff] text-[#0b141a] font-bold' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>Position & Scale</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePhotoTool('filter')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                        activePhotoTool === 'filter' ? 'bg-[#00a8ff] text-[#0b141a] font-bold' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Filter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePhotoTool('text')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                        activePhotoTool === 'text' ? 'bg-[#00a8ff] text-[#0b141a] font-bold' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Sticker/Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePhotoTool('bg')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                        activePhotoTool === 'bg' ? 'bg-[#00a8ff] text-[#0b141a] font-bold' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Canvas Bg</span>
                    </button>
                  </div>

                  {/* Tool Active Panel */}
                  {activePhotoTool === 'adjust' && (
                    <div className="space-y-3 pt-1 text-xs">
                      {/* Zoom & Rotate Controls */}
                      <div className="grid grid-cols-2 gap-3 items-center">
                        {/* Zoom Control */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-gray-300 text-[11px]">
                            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3 text-[#00a8ff]" /> Zoom</span>
                            <span className="font-mono text-[#00a8ff]">{Math.round(photoZoom * 100)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => setPhotoZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
                              className="p-1 bg-white/10 hover:bg-white/20 rounded"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="range" 
                              min="0.5" 
                              max="2.5" 
                              step="0.05"
                              value={photoZoom}
                              onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                              className="flex-1 accent-[#00a8ff] h-1.5 bg-gray-700 rounded-lg cursor-pointer"
                            />
                            <button 
                              type="button" 
                              onClick={() => setPhotoZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(1)))}
                              className="p-1 bg-white/10 hover:bg-white/20 rounded"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Rotation Control */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-gray-300 text-[11px]">
                            <span className="flex items-center gap-1"><RotateCw className="w-3 h-3 text-[#00a8ff]" /> Rotation</span>
                            <span className="font-mono text-[#00a8ff]">{photoRotation}°</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[0, 90, 180, 270].map((deg) => (
                              <button
                                key={deg}
                                type="button"
                                onClick={() => setPhotoRotation(deg)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                                  photoRotation === deg ? 'bg-[#00a8ff] text-[#0b141a]' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Directional Shift & Fit Mode */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#202c33]">
                        {/* 4-way Nudge buttons */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 mr-1">Shift:</span>
                          <button 
                            type="button" 
                            onClick={() => setPhotoPositionY((y) => y - 15)}
                            className="p-1 bg-white/10 hover:bg-white/20 rounded" 
                            title="Nudge Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setPhotoPositionY((y) => y + 15)}
                            className="p-1 bg-white/10 hover:bg-white/20 rounded" 
                            title="Nudge Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setPhotoPositionX((x) => x - 15)}
                            className="p-1 bg-white/10 hover:bg-white/20 rounded" 
                            title="Nudge Left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setPhotoPositionX((x) => x + 15)}
                            className="p-1 bg-white/10 hover:bg-white/20 rounded" 
                            title="Nudge Right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPhotoPositionX(0); setPhotoPositionY(0); }}
                            className="text-[10px] bg-white/10 hover:bg-white/20 px-1.5 py-1 rounded text-gray-300 ml-1"
                          >
                            Center
                          </button>
                        </div>

                        {/* Fit Mode */}
                        <div className="flex items-center gap-1">
                          {(['contain', 'cover', 'fill'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPhotoFitMode(mode)}
                              className={`px-2 py-1 rounded text-[10px] capitalize font-medium ${
                                photoFitMode === mode ? 'bg-[#00a8ff] text-[#0b141a] font-bold' : 'bg-white/10 text-gray-300'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filter Panel */}
                  {activePhotoTool === 'filter' && (
                    <div className="flex items-center justify-around gap-1.5 py-1 text-xs overflow-x-auto">
                      {[
                        { id: 'normal', label: 'Normal' },
                        { id: 'vintage', label: 'Vintage' },
                        { id: 'mono', label: 'B&W Mono' },
                        { id: 'cyber', label: 'Cyber' },
                        { id: 'warm', label: 'Warm Sun' },
                        { id: 'dramatic', label: 'Dramatic' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                            selectedFilter === f.id ? 'bg-[#00a8ff] text-[#0b141a] font-bold' : 'bg-white/10 text-gray-200 hover:bg-white/20'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text Overlay Panel */}
                  {activePhotoTool === 'text' && (
                    <div className="space-y-2 py-1 text-xs">
                      <input
                        type="text"
                        placeholder="Type text/sticker to put on photo..."
                        value={photoTextOverlay}
                        onChange={(e) => setPhotoTextOverlay(e.target.value)}
                        className="w-full bg-[#202c33] border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#00a8ff]"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">Color:</span>
                        {['#ffffff', '#00a8ff', '#ff3b30', '#ffcc00', '#38bdf8', '#a855f7', '#000000'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setPhotoTextColor(c)}
                            className={`w-6 h-6 rounded-full border-2 ${
                              photoTextColor === c ? 'border-white scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Canvas Bg Panel */}
                  {activePhotoTool === 'bg' && (
                    <div className="flex items-center justify-between py-1 text-xs">
                      <span className="text-gray-300 text-[11px]">Background Canvas Color:</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: '#000000', label: 'Black' },
                          { color: '#111b21', label: 'WhatsApp Dark' },
                          { color: '#0f382c', label: 'Emerald' },
                          { color: '#1e1b4b', label: 'Navy' },
                          { color: '#31102f', label: 'Plum' },
                          { color: '#1f2937', label: 'Slate' }
                        ].map((b) => (
                          <button
                            key={b.color}
                            type="button"
                            onClick={() => setPhotoCanvasBg(b.color)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              photoCanvasBg === b.color ? 'border-white scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: b.color }}
                            title={b.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="max-w-md mx-auto w-full space-y-2 pt-2 relative">
            {/* @mention suggestions dropdown */}
            {showMentionSuggestions && (
              <div className="absolute bottom-16 left-0 right-0 max-h-48 overflow-y-auto bg-[#1f2c34] border border-[#2a3942] rounded-2xl shadow-2xl z-50 p-2 space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase px-3 py-1">Mention a contact (@)</p>
                {availableContacts
                  .filter(c => 
                    (c.name && c.name.toLowerCase().includes(mentionQuery)) ||
                    (c.username && c.username.toLowerCase().includes(mentionQuery))
                  )
                  .map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectMentionContact(c, creatorType === 'text')}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                    >
                      <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-[#00a8ff]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-[#00a8ff] truncate">@{c.username || c.name.toLowerCase().replace(/\s+/g, '')}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Mentioned User Tags Pills */}
            {mentionedUsernames.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap px-1 pb-1">
                <span className="text-[11px] text-gray-400 font-medium">Mentioned:</span>
                {mentionedUsernames.map((uname, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#00a8ff]/20 border border-[#00a8ff]/40 text-[#00a8ff] text-[11px] font-bold flex items-center gap-1">
                    {uname}
                    <button
                      type="button"
                      onClick={() => {
                        setMentionedUsernames(prev => prev.filter(u => u !== uname));
                      }}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder={creatorType === 'text' ? "Add a caption or mentions..." : "Add a caption (type @ to mention friends)..."}
              value={statusCaption}
              onChange={(e) => handleStatusTextOrCaptionChange(e.target.value, false)}
              className="w-full bg-[#202c33] border border-white/20 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#00a8ff]"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-xs text-gray-300 hover:text-[#00a8ff] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                title="Click to set status privacy & select friends"
              >
                <Lock className="w-3.5 h-3.5 text-[#00a8ff]" />
                <span>Status privacy: <strong className="text-white font-bold">{getPrivacyLabel()}</strong></span>
              </button>

              <button
                type="button"
                onClick={handlePublishStatus}
                disabled={isPublishing || (creatorType === 'text' && !statusText.trim())}
                className="bg-[#00a8ff] text-[#0b141a] px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#0088cc] active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-lg shrink-0"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0b141a]" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-4 h-4 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border max-h-[90vh] flex flex-col ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#202c33] shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00a8ff]" />
                Status Privacy
              </h3>
              <button type="button" onClick={() => setShowPrivacyModal(false)} className="p-1 rounded-full hover:bg-gray-500/20 cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="py-3 space-y-3 overflow-y-auto flex-1 pr-1">
              <p className="text-xs text-gray-500 dark:text-[#8596a0]">
                Who can see my status updates? Select friends to customize access.
              </p>

              {[
                { id: 'contacts', label: 'My all contacts', desc: 'All your saved contacts can view' },
                { id: 'only', label: 'Only share with...', desc: 'Select specific contacts to share with' }
              ].map((opt) => (
                <label 
                  key={opt.id}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    privacySetting === opt.id 
                      ? 'border-[#00a8ff] bg-[#00a8ff]/10' 
                      : (isDark ? 'border-[#202c33] hover:bg-[#202c33]' : 'border-gray-200 hover:bg-gray-50')
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-[#8596a0]">{opt.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacySetting === opt.id}
                    onChange={() => setPrivacySetting(opt.id as any)}
                    className="accent-[#00a8ff] w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}

              {/* Contact Picker Section when Only share with... is selected */}
              {privacySetting === 'only' && (
                <div className={`mt-3 p-3.5 rounded-2xl border space-y-2.5 animate-fade-in ${
                  isDark ? 'bg-[#0b141a] border-[#202c33]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#00a8ff]">
                      Share status ONLY with these contacts:
                    </p>
                    <span className="text-[11px] text-[#00a8ff] font-bold bg-[#00a8ff]/10 px-2 py-0.5 rounded-full">
                      {selectedPrivacyContactIds.length} selected
                    </span>
                  </div>

                  {/* Search Box */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={privacySearchQuery}
                      onChange={(e) => setPrivacySearchQuery(e.target.value)}
                      placeholder="Search contacts..."
                      className={`w-full text-xs px-3 py-2 rounded-xl border text-e9edef focus:outline-none focus:border-[#00a8ff] ${
                        isDark ? 'bg-[#111b21] border-[#202c33] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  {/* Quick Select All / Deselect All */}
                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPrivacyContactIds(availableContacts.map(c => c.id))}
                      className="text-[#00a8ff] hover:underline font-semibold cursor-pointer"
                    >
                      Select All ({availableContacts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPrivacyContactIds([])}
                      className="text-gray-400 hover:text-gray-200 font-medium cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>

                  {/* Scrollable Contacts Checklist */}
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {availableContacts
                      .filter(c => c.name.toLowerCase().includes(privacySearchQuery.toLowerCase()))
                      .map(contact => {
                        const isChecked = selectedPrivacyContactIds.includes(contact.id);
                        return (
                          <div
                            key={contact.id}
                            onClick={() => togglePrivacyContact(contact.id)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-[#00a8ff]/20 border border-[#00a8ff]/50' 
                                : (isDark ? 'bg-[#1f2c34]/40 hover:bg-[#1f2c34]' : 'bg-white hover:bg-gray-100 border border-gray-200')
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={contact.avatar}
                                alt={contact.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#00a8ff]/30"
                              />
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold truncate text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {contact.name}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                  {contact.username || contact.status || 'Contact'}
                                </p>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked ? 'bg-[#00a8ff] border-[#00a8ff] text-[#0b141a]' : 'border-gray-500'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="w-full bg-[#00a8ff] text-[#0b141a] font-bold py-3 rounded-2xl hover:bg-[#0088cc] transition-all cursor-pointer mt-3 shrink-0 shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {privacyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00a8ff] text-[#0b141a] px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl animate-fade-in z-50 flex items-center gap-2 border border-white/20">
          <ShieldCheck className="w-4 h-4" />
          <span>{privacyToast}</span>
        </div>
      )}

      {/* Realtime Status Mention Notification Popup Banner */}
      {activeMentionNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-slide-down">
          <div 
            onClick={async () => {
              const notifStatusId = activeMentionNotification.statusId;
              dismissMentionNotification();
              if (notifStatusId) {
                const res = await openMentionedStatus(notifStatusId);
                if (res.success && res.status) {
                  const foundGroupIdx = allViewerGroups.findIndex(g => g.statuses.some(s => s.id === notifStatusId));
                  if (foundGroupIdx >= 0) {
                    setSelectedGroupIndex(foundGroupIdx);
                  } else {
                    setSelectedGroupIndex(0);
                  }
                } else {
                  setPrivacyToast(res.message || 'This status is no longer available.');
                  setTimeout(() => setPrivacyToast(null), 3500);
                }
              }
            }}
            className="p-3.5 rounded-2xl bg-[#111b21] border-2 border-[#00a8ff] text-white shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-[#182229] transition-all group"
          >
            <img
              src={activeMentionNotification.ownerPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt="Avatar"
              className="w-11 h-11 rounded-full object-cover border-2 border-[#00a8ff] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-[#00a8ff] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Status Mention
              </p>
              <p className="text-xs font-medium text-white truncate">
                {activeMentionNotification.body || `${activeMentionNotification.ownerName} mentioned you in their Status.`}
              </p>
              <p className="text-[10px] text-emerald-400 font-bold mt-0.5 underline">
                Tap to view Status directly
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissMentionNotification();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
