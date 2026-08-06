import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';
import { 
  Send, Plus, Smile, Image, Video, FileText, Trash2, ArrowLeft, ShieldCheck, 
  Lock, CheckCheck, Check, Paperclip, Camera, Phone, Mic, MicOff, MoreVertical, X,
  Search, CheckSquare, Heart, Ban, MinusCircle, Copy, Pin, Archive, Star,
  CornerUpLeft, Play, Pause, Volume2, Edit3, Forward, Share2, Info, ChevronRight, File, PhoneCall, Tag,
  RotateCw, RefreshCw, Music, MapPin, User, ZoomIn, ZoomOut, Download, Clock, UserCheck, UserPlus, Flag, XCircle,
  AlertCircle, Loader2
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useVault } from '../context/VaultContext';
import { MediaAttachment, Message, Contact, StatusUpdate } from '../types';
import { StatusViewer } from './Status/StatusViewer';
import { NicknameModal } from './NicknameModal';
import { compressImage } from '../lib/mediaCompressor';
import { formatChatDate, formatMessageTime, formatLastSeen } from '../lib/dateUtils';
import { DateSeparator } from './DateSeparator';
import { VideoMessagePlayer } from './VideoMessagePlayer';
import { extractVideoMetadata } from '../lib/videoUtils';
import { MessageSelectionToolbar } from './MessageSelectionToolbar';
import { EmojiReactionBar } from './EmojiReactionBar';
import { PinnedMessageBanner } from './PinnedMessageBanner';
import { WhatsAppProfileViewer } from './WhatsAppProfileViewer';
import { SetChatWallpaperModal } from './SetChatWallpaperModal';
import { SelectMembersModal } from './SelectMembersModal';
import { renderTextWithLinks } from '../lib/linkUtils';
import { getGroupMembersList } from '../lib/groupUtils';

const EMOJI_LIST: string[] = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','😘','😗','😚','😙',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄',
  '😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯',
  '🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰',
  '😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀',
  '☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','🎃',
  '😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  '🙈','🙉','🙊',
  '💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍',
  '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🙏',
  '✍️','💅','🤳',
  '👋','🤚','🖐️','✋','🖖','👈','👉','👆','👇','☝️',
  '💪','🦾','🦵','🦶','👂','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅',
  '👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵',
  '🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷',
  '🚶','🏃','💃','🕺','🧍','🧎',
  '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥',
  '🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽',
  '🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🧆','🥘','🍝','🍜','🍲',
  '🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍥',
  '🍰','🎂','🍮','🍭','🍬','🍫','🍿',
  '☕','🍵','🥤','🧃','🍺','🍻',
  '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸',
  '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒',
  '✈️','🚀','🚁','🚢',
  '⌚','📱','💻','⌨️','🖥️','🖱️','💡','🔦','📷','📹',
  '📞','☎️','📺','📻',
  '📦','📁','📂','🗂️','📅','📆','🗓️',
  '✏️','🖊️','🖋️','📝','📖','📚',
  '🔒','🔓','🔑','🔨','🛠️',
  '❤️🔥','❤️🩹','💯','✔️','❌','⚠️','🔥','✨','⭐','🌟'
];

// Helper to check if message was sent within 2 minutes (120,000 ms) for editing
const getMsgTimestamp = (m: Message): number => {
  if (typeof m.timestamp === 'number') return m.timestamp;
  if (m.createdAt?.toMillis && typeof m.createdAt.toMillis === 'function') return m.createdAt.toMillis();
  if (m.createdAt?.seconds) return m.createdAt.seconds * 1000;
  return Date.now();
};

const isMessageEditable = (m: Message | null): boolean => {
  if (!m || m.deletedForEveryone) return false;
  const time = getMsgTimestamp(m);
  return Date.now() - time <= 2 * 60 * 1000;
};

export const ChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const { 
    activeContactId, setActiveContactId, setActiveTab, contacts, messages, 
    sendMessage, editMessage, user, deleteMessage, deleteForEveryone, toggleStarMessage,
    togglePinMessage, forwardMessage, setTypingStatus, settings, togglePinContact,
    toggleArchiveContact, clearChatHistory, blockContact, unblockContact,
    blockedContactIds, blockedByContactIds, startCall,
    customNicknames, getContactDisplayName, isFriend, unfriendContact,
    markViewOnceOpened, sendFriendRequest, acceptFriendRequest,
    pendingFriendRequests, sentFriendRequests,
    addReactionMessage, removeReactionMessage, deleteMultipleMessages, authUser,
    updateGroupDetails, deleteGroup, adminWallpapers,
    statusUpdates, likeStatusUpdate, markStatusAsSeen, replyToStatus, reactToStatus,
    deleteStatusUpdate, getSeenRecords, getLikeRecords, allRegisteredUsers
  } = useVault();

  // Status Viewer from Chat Reply / Reaction State
  const [statusViewerGroups, setStatusViewerGroups] = useState<any[] | null>(null);
  const [statusViewerGroupIdx, setStatusViewerGroupIdx] = useState<number>(0);
  const [statusViewerStatusIdx, setStatusViewerStatusIdx] = useState<number>(0);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);

  const handleOpenStatusFromReply = async (statusId: string, statusOwnerId?: string) => {
    if (!statusId) return;

    setIsLoadingStatus(true);
    try {
      let targetStatus: StatusUpdate | null = null;

      // 1. Check local statusUpdates from context
      targetStatus = (statusUpdates || []).find((s: StatusUpdate) => s.id === statusId) || null;

      // 2. If not found in memory, query Firestore directly
      if (!targetStatus && db) {
        const snap = await getDoc(doc(db, 'status', statusId)).catch(() => null);
        if (snap && snap.exists()) {
          const data = snap.data();
          let createdMs = Date.now();
          if (data.createdAt?.toMillis) {
            createdMs = data.createdAt.toMillis();
          } else if (data.createdAt?.seconds) {
            createdMs = data.createdAt.seconds * 1000;
          } else if (typeof data.createdAt === 'number') {
            createdMs = data.createdAt;
          }

          const twentyFourHoursMs = 24 * 60 * 60 * 1000;
          if (Date.now() - createdMs <= twentyFourHoursMs) {
            targetStatus = {
              id: snap.id,
              userId: data.userId,
              userName: data.userName || 'User',
              userAvatar: data.userAvatar || '',
              text: data.text,
              mediaUrl: data.mediaUrl,
              mediaType: data.mediaType || 'image',
              caption: data.caption,
              bgColor: data.bgColor,
              privacyMode: data.privacyMode || 'contacts',
              allowedUserIds: data.allowedUserIds || [],
              createdAt: data.createdAt,
              expiresAt: data.expiresAt,
              likes: data.likes || [],
              seenUserIds: data.seenUserIds || [],
              likesCount: data.likesCount || 0,
              seenCount: data.seenCount || 0,
              repliesCount: data.repliesCount || 0,
            };
          }
        }
      }

      // 3. If missing or expired (>24 hours)
      if (!targetStatus) {
        setStatusToast('This status is no longer available.');
        setTimeout(() => setStatusToast(null), 3500);
        setIsLoadingStatus(false);
        return;
      }

      let createdMs = Date.now();
      if (targetStatus.createdAt?.toMillis) {
        createdMs = targetStatus.createdAt.toMillis();
      } else if (targetStatus.createdAt?.seconds) {
        createdMs = targetStatus.createdAt.seconds * 1000;
      } else if (typeof targetStatus.createdAt === 'number') {
        createdMs = targetStatus.createdAt;
      }

      if (Date.now() - createdMs > 24 * 60 * 60 * 1000) {
        setStatusToast('This status is no longer available.');
        setTimeout(() => setStatusToast(null), 3500);
        setIsLoadingStatus(false);
        return;
      }

      // 4. Group all available statuses for this owner
      const targetUserId = targetStatus.userId || statusOwnerId || 'unknown';
      let ownerStatuses = (statusUpdates || []).filter((s: StatusUpdate) => s.userId === targetUserId);
      if (!ownerStatuses.some((s: StatusUpdate) => s.id === targetStatus!.id)) {
        ownerStatuses = [targetStatus, ...ownerStatuses];
      }

      const targetGroup = {
        userId: targetUserId,
        userName: targetStatus.userName || 'User',
        userAvatar: targetStatus.userAvatar || '',
        statuses: ownerStatuses,
      };

      const targetStatusIdx = ownerStatuses.findIndex((s: StatusUpdate) => s.id === targetStatus!.id);

      setStatusViewerGroups([targetGroup]);
      setStatusViewerGroupIdx(0);
      setStatusViewerStatusIdx(targetStatusIdx >= 0 ? targetStatusIdx : 0);
    } catch (err) {
      console.error('Error opening status from reply:', err);
      setStatusToast('This status is no longer available.');
      setTimeout(() => setStatusToast(null), 3500);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const [showUnfriendConfirmModal, setShowUnfriendConfirmModal] = useState(false);
  const [showEditGroupNameModal, setShowEditGroupNameModal] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [showDeleteGroupConfirmModal, setShowDeleteGroupConfirmModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  // Per-chat custom wallpaper dictionary
  const [perChatWallpapers, setPerChatWallpapers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('calcchat_per_chat_wallpapers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const groupWallpaperInputRef = useRef<HTMLInputElement>(null);

  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';
  
  const contact = contacts.find(c => c.id === activeContactId);
  
  // Wallpaper styling - priority: 1) per-chat custom wallpaper, 2) group wallpaper, 3) global app wallpaper
  const chatWallpaper = (contact?.id && perChatWallpapers[contact.id])
    ? perChatWallpapers[contact.id]
    : (contact?.isGroup && contact?.wallpaper)
    ? contact.wallpaper
    : (settings?.chatWallpaper || 'default');

  const isCustomImage = Boolean(
    chatWallpaper && 
    chatWallpaper !== 'default' && 
    (chatWallpaper.startsWith('data:image/') || chatWallpaper.startsWith('http://') || chatWallpaper.startsWith('https://') || chatWallpaper.startsWith('blob:'))
  );
  const isCustomColor = Boolean(
    chatWallpaper && 
    chatWallpaper !== 'default' && 
    (chatWallpaper.startsWith('#') || chatWallpaper.startsWith('rgb') || chatWallpaper.startsWith('hsl'))
  );

  // Input & Modal States
  const [inputText, setInputText] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type?: 'image' | 'video'; name?: string } | string | null>(null);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const isSelectMode = selectedMsgIds.length > 0;
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  // Message Action States
  const [replyingToMsg, setReplyingToMsg] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [forwardContactIds, setForwardContactIds] = useState<string[]>([]);
  const [forwardSearch, setForwardSearch] = useState('');
  const [msgContextMenuId, setMsgContextMenuId] = useState<string | null>(null);

  // WhatsApp Delete Message Modal States
  const [deleteModalMsg, setDeleteModalMsg] = useState<Message | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'everyone' | 'me' | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe to Reply States
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const swipeTouchStartRef = useRef<{ x: number; y: number; msgId: string } | null>(null);
  const isSwipingHorizontalRef = useRef<boolean>(false);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  // Auto clear typing timeout when switching chats or unmounting
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (activeContactId) {
        setTypingStatus(activeContactId, false);
      }
    };
  }, [activeContactId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!activeContactId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (val.trim().length > 0) {
      setTypingStatus(activeContactId, true);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(activeContactId, false);
      }, 2500);
    } else {
      setTypingStatus(activeContactId, false);
    }
  };

  // Audio Voice Recording & Playback States
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showMicBlockedModal, setShowMicBlockedModal] = useState(false);
  const [audioPlaybackSpeeds, setAudioPlaybackSpeeds] = useState<Record<string, number>>({});
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, { currentTime: number; duration: number }>>({});

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // File Upload & Live Camera Refs/States
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // View Once & Lightbox States
  const [viewOnceActiveMedia, setViewOnceActiveMedia] = useState<{ msg: Message; media: MediaAttachment } | null>(null);
  const [cameraViewOnce, setCameraViewOnce] = useState<boolean>(false);

  // Multi-Media Preview & Upload States
  interface PendingMediaItem {
    id: string;
    file?: File;
    type: 'image' | 'video' | 'file' | 'audio';
    url: string;
    name: string;
    sizeStr: string;
    durationStr?: string;
    thumbnailUrl?: string;
    isViewOnce?: boolean;
  }
  const [pendingMediaList, setPendingMediaList] = useState<PendingMediaItem[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [mediaCaption, setMediaCaption] = useState<string>('');
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Contact Picker & Location States
  const [showContactPickerModal, setShowContactPickerModal] = useState<boolean>(false);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');

  // Lightbox Zoom / Rotate
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);

  useEffect(() => {
    if (showCameraModal && cameraStream && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  const openCameraModal = async (mode: 'user' | 'environment' = 'user') => {
    setCapturedPhoto(null);
    setCameraError(null);
    setShowCameraModal(true);
    setShowAttachModal(false);

    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setFacingMode(mode);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Unable to access camera directly. You can select an image or record with your device camera.');
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCapturedPhoto(null);
    setCameraError(null);
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedPhoto(dataUrl);
    }
  };

  const sendCapturedPhoto = async () => {
    if (!capturedPhoto || !activeContactId) return;
    try {
      const compressed = await compressImage(capturedPhoto, 1000, 450000);
      const media: MediaAttachment = {
        id: 'cam_' + Date.now(),
        type: 'image',
        name: `Camera_Photo_${Date.now()}.jpg`,
        url: compressed || capturedPhoto,
        isViewOnce: cameraViewOnce,
      };
      sendMessage(activeContactId, '📷 Photo', media);
      closeCameraModal();
      setCameraViewOnce(false);
      showToast(cameraViewOnce ? 'View once photo sent' : 'Photo sent');
    } catch (err) {
      console.warn('Error compressing camera photo:', err);
      closeCameraModal();
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    openCameraModal(nextMode);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const scrollToMessage = (msgId: string) => {
    const elem = document.getElementById(`msg_${msgId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    } else {
      showToast('Message not found in chat history.');
    }
  };

  const handleCopyMessage = (msg: Message) => {
    if (!msg.text) {
      showToast('No text content to copy.');
      return;
    }
    navigator.clipboard.writeText(msg.text).then(() => {
      showToast('Message copied');
      setSelectedMsgIds([]);
      setActiveReactionMsgId(null);
    }).catch(() => {
      showToast('Failed to copy message.');
    });
  };

  const handlePinMessage = (msg: Message) => {
    if (!contact) return;
    togglePinMessage(contact.id, msg.id);
    showToast(msg.isPinned ? 'Message unpinned' : 'Message pinned');
    setSelectedMsgIds([]);
    setActiveReactionMsgId(null);
  };

  const handleDeleteSelection = async (selectedMsgs: Message[]) => {
    if (!contact || selectedMsgs.length === 0) return;
    if (selectedMsgs.length === 1) {
      setDeleteModalMsg(selectedMsgs[0]);
      setDeleteConfirmType(null);
    } else {
      const ids = selectedMsgs.map(m => m.id);
      await deleteMultipleMessages(contact.id, ids, false);
      showToast(`${ids.length} messages deleted`);
      setSelectedMsgIds([]);
      setActiveReactionMsgId(null);
    }
  };

  const handleForwardSelection = (msg: Message) => {
    setForwardingMsg(msg);
    setForwardContactIds([]);
    setSelectedMsgIds([]);
    setActiveReactionMsgId(null);
  };

  const handleReplySelection = (msg: Message) => {
    setReplyingToMsg(msg);
    setSelectedMsgIds([]);
    setActiveReactionMsgId(null);
  };

  const handleSelectReaction = async (msgId: string, emoji: string) => {
    if (!contact) return;
    await addReactionMessage(contact.id, msgId, emoji);
    setActiveReactionMsgId(null);
    setSelectedMsgIds([]);
  };

  const handleMsgTouchStart = (msg: Message) => {
    if (msg.deletedForEveryone) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(40); } catch (e) {}
      }
      setSelectedMsgIds(prev => {
        if (prev.includes(msg.id)) return prev;
        return [...prev, msg.id];
      });
      setActiveReactionMsgId(msg.id);
    }, 380);
  };

  const handleMsgTouchEndOrMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchStartMessage = (e: React.TouchEvent, msg: Message) => {
    if (msg.deletedForEveryone) return;
    const touch = e.touches[0];
    swipeTouchStartRef.current = { x: touch.clientX, y: touch.clientY, msgId: msg.id };
    isSwipingHorizontalRef.current = false;
    hasTriggeredHapticRef.current = false;
    handleMsgTouchStart(msg);
  };

  const handleTouchMoveMessage = (e: React.TouchEvent, msg: Message) => {
    if (!swipeTouchStartRef.current || swipeTouchStartRef.current.msgId !== msg.id) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeTouchStartRef.current.x;
    const deltaY = touch.clientY - swipeTouchStartRef.current.y;

    if (!isSwipingHorizontalRef.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 6) {
        // Vertical scrolling detected - cancel swipe gesture to allow smooth document scroll
        swipeTouchStartRef.current = null;
        handleMsgTouchEndOrMove();
        return;
      }
      if (deltaX > 8 && deltaX > Math.abs(deltaY)) {
        isSwipingHorizontalRef.current = true;
        handleMsgTouchEndOrMove(); // Cancel long press timer
      }
    }

    if (isSwipingHorizontalRef.current && deltaX > 0) {
      const clampedOffset = Math.min(deltaX * 0.7, 75);
      setSwipingMsgId(msg.id);
      setSwipeOffset(clampedOffset);

      if (clampedOffset >= 48 && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          try { window.navigator.vibrate(30); } catch (err) {}
        }
      }
    }
  };

  const handleTouchEndMessage = (msg: Message) => {
    handleMsgTouchEndOrMove();
    if (swipingMsgId === msg.id && isSwipingHorizontalRef.current) {
      if (swipeOffset >= 45 || hasTriggeredHapticRef.current) {
        handleReplySelection(msg);
      }
    }
    setSwipingMsgId(null);
    setSwipeOffset(0);
    swipeTouchStartRef.current = null;
    isSwipingHorizontalRef.current = false;
    hasTriggeredHapticRef.current = false;
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteModalMsg) {
          setDeleteModalMsg(null);
          setDeleteConfirmType(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModalMsg]);

  // Helper function to detect optimal browser-supported mimeType for audio recording
  const getSupportedMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const curMessages = (activeContactId && messages[activeContactId]) || [];
  const pinnedMessage = curMessages.find(m => m.isPinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [curMessages.length, activeContactId]);

  // Group Creator check and group management handlers
  const isGroupCreator = Boolean(
    contact?.isGroup && (
      !contact.createdBy || 
      contact.createdBy === authUser?.uid || 
      contact.createdBy === user.id
    )
  );

  const handleGroupAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contact || !contact.isGroup) return;

    try {
      showToast('Uploading group photo...');
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      if (!dataUrl) return;
      const compressed = await compressImage(dataUrl, 500, 180000);
      await updateGroupDetails(contact.id, { avatar: compressed || dataUrl });
      showToast('Group photo updated successfully!');
    } catch (err: any) {
      console.error('Group photo upload error:', err);
      showToast(err?.message || 'Failed to update group photo');
    } finally {
      e.target.value = '';
    }
  };

  const handleGroupWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contact || !contact.isGroup) return;

    try {
      showToast('Uploading group wallpaper...');
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      if (!dataUrl) return;
      const compressed = await compressImage(dataUrl, 800, 250000);
      await updateGroupDetails(contact.id, { wallpaper: compressed || dataUrl });
      showToast('Group wallpaper updated for everyone!');
    } catch (err: any) {
      console.error('Group wallpaper upload error:', err);
      showToast(err?.message || 'Failed to update group wallpaper');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveGroupName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !contact.isGroup || !newGroupNameInput.trim()) return;
    try {
      await updateGroupDetails(contact.id, { name: newGroupNameInput.trim() });
      showToast('Group name updated successfully!');
      setShowEditGroupNameModal(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update group name');
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!contact || !contact.isGroup) return;
    try {
      const gName = contact.name;
      await deleteGroup(contact.id);
      showToast(`Group "${gName}" deleted for everyone`);
      setShowDeleteGroupConfirmModal(false);
      setShowRightSidebar(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete group');
    }
  };

  // Voice recording timer
  useEffect(() => {
    if (isRecording && !isRecordingPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording, isRecordingPaused]);

  // Audio Playback Listener Effect
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    if (!playingAudioMsgId) return;

    const targetMsg = curMessages.find(m => m.id === playingAudioMsgId);
    if (!targetMsg || !targetMsg.media || !targetMsg.media.url) {
      setPlayingAudioMsgId(null);
      return;
    }

    try {
      const audio = new Audio(targetMsg.media.url);
      const currentSpeed = audioPlaybackSpeeds[playingAudioMsgId] || 1;
      audio.playbackRate = currentSpeed;
      audioElementRef.current = audio;

      audio.ontimeupdate = () => {
        setAudioProgress(prev => ({
          ...prev,
          [playingAudioMsgId]: {
            currentTime: audio.currentTime,
            duration: audio.duration || 1,
          }
        }));
      };

      audio.onended = () => {
        setPlayingAudioMsgId(null);
        setAudioProgress(prev => ({
          ...prev,
          [playingAudioMsgId]: {
            currentTime: 0,
            duration: audio.duration || 1,
          }
        }));
      };

      audio.onerror = () => {
        showToast('Unable to play audio note');
        setPlayingAudioMsgId(null);
      };

      audio.play().catch(err => {
        console.warn('Playback error:', err);
        setPlayingAudioMsgId(null);
      });
    } catch (err) {
      console.warn('Audio setup error:', err);
      setPlayingAudioMsgId(null);
    }

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, [playingAudioMsgId, curMessages]);

  if (!contact || !activeContactId) {
    return (
      <div className="flex-1 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-slate-500 text-xs select-none">
        <ShieldCheck className="w-12 h-12 text-[#00a8ff]/60 mb-2 animate-pulse" />
        <p className="font-mono text-slate-400">SELECT A CONVERSATION TO CHAT</p>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContactId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setTypingStatus(activeContactId, false);

    if (editingMsg) {
      if (!isMessageEditable(editingMsg)) {
        showToast('Editing time limit expired (2 minutes limit)');
        setEditingMsg(null);
        setInputText('');
        return;
      }
      editMessage(activeContactId, editingMsg.id, inputText.trim());
      setEditingMsg(null);
      showToast('Message edited');
    } else {
      const replyContext = replyingToMsg ? {
        id: replyingToMsg.id,
        senderName: replyingToMsg.senderId === user.id ? 'You' : contact.name,
        text: replyingToMsg.text,
      } : undefined;

      sendMessage(activeContactId, inputText.trim(), undefined, replyContext);
      setReplyingToMsg(null);
    }

    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Voice recording is not supported in this browser');
      return;
    }

    audioChunksRef.current = [];
    let stream: MediaStream | null = null;

    try {
      // Direct call to getUserMedia triggers browser's native permission popup on first click
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (firstErr: any) {
      console.warn('Primary getUserMedia attempt failed:', firstErr);
      if (
        firstErr.name === 'NotAllowedError' ||
        firstErr.name === 'PermissionDeniedError' ||
        firstErr.name === 'SecurityError'
      ) {
        setShowMicBlockedModal(true);
        return;
      }

      // Fallback attempt with standard audio constraint
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (fallbackErr: any) {
        console.warn('Fallback getUserMedia attempt failed:', fallbackErr);
        if (
          fallbackErr.name === 'NotAllowedError' ||
          fallbackErr.name === 'PermissionDeniedError' ||
          fallbackErr.name === 'SecurityError'
        ) {
          setShowMicBlockedModal(true);
        } else if (
          fallbackErr.name === 'NotFoundError' ||
          fallbackErr.name === 'DevicesNotFoundError'
        ) {
          showToast('No microphone found on your device.');
        } else if (
          fallbackErr.name === 'NotReadableError' ||
          fallbackErr.name === 'TrackStartError'
        ) {
          showToast('Microphone is in use by another application.');
        } else {
          showToast('Unable to access microphone.');
        }
        return;
      }
    }

    if (!stream) return;

    try {
      mediaStreamRef.current = stream;
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);
    } catch (recorderErr) {
      console.error('Failed to create MediaRecorder:', recorderErr);
      showToast('Error starting audio recorder');
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        if (isRecordingPaused) {
          mediaRecorderRef.current.resume();
        } else {
          mediaRecorderRef.current.pause();
        }
      } catch (e) {
        console.warn('Pause/Resume audio failed:', e);
      }
    }
    setIsRecordingPaused(prev => !prev);
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
  };

  const handleSendRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) {
      showToast('No active recording');
      return;
    }

    const mins = Math.floor(recordingSeconds / 60);
    const secs = recordingSeconds % 60;
    const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const recorder = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;

    const processAndSend = () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);

      if (audioChunksRef.current.length === 0) {
        showToast('Voice note was empty. Please try again.');
        return;
      }

      const finalMimeType = recorder?.mimeType || getSupportedMimeType() || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });

      if (audioBlob.size < 200) {
        showToast('Voice note too short');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const media: MediaAttachment = {
          id: 'voice_' + Date.now(),
          type: 'audio',
          name: `Voice note (${durationStr})`,
          url: dataUrl,
          duration: durationStr,
        };

        sendMessage(activeContactId, '🎤 Voice message', media);
        showToast('Voice message sent');
      };
      reader.onerror = () => {
        showToast('Failed to prepare voice message');
      };
      reader.readAsDataURL(audioBlob);
    };

    try {
      if (recorder.state !== 'inactive') {
        try { recorder.requestData(); } catch (e) {}
        recorder.onstop = processAndSend;
        recorder.stop();
      } else {
        processAndSend();
      }
    } catch (err) {
      console.warn('Error stopping media recorder:', err);
      processAndSend();
    }
  };

  const toggleAudioSpeed = (msgId: string) => {
    setAudioPlaybackSpeeds(prev => {
      const current = prev[msgId] || 1;
      const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
      if (playingAudioMsgId === msgId && audioElementRef.current) {
        audioElementRef.current.playbackRate = next;
      }
      return { ...prev, [msgId]: next };
    });
  };

  const handleAttachMedia = (type: 'image' | 'video' | 'file') => {
    const sampleImages = [
      { name: 'Blueprint_TopSecret.png', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
      { name: 'Confidential_Matrix_Code.jpg', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' },
      { name: 'Surveillance_Camera_Grid.png', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80' }
    ];

    const sampleVideos = [
      { name: 'Drone_Surveillance_Feed.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-42861-large.mp4' },
      { name: 'Server_Room_Activity.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-data-center-server-room-41977-large.mp4' }
    ];

    let media: MediaAttachment;

    if (type === 'image') {
      const picked = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      media = {
        id: 'att_' + Date.now(),
        type: 'image',
        name: picked.name,
        url: picked.url,
      };
      sendMessage(activeContactId, 'Attached confidential image', media);
    } else if (type === 'video') {
      const picked = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
      media = {
        id: 'att_' + Date.now(),
        type: 'video',
        name: picked.name,
        url: picked.url,
      };
      sendMessage(activeContactId, 'Attached drone surveillance feed', media);
    } else {
      media = {
        id: 'att_' + Date.now(),
        type: 'file',
        name: `Document_Archive_${Math.floor(Math.random() * 900 + 100)}.pdf`,
        url: '#',
        size: '2.4 MB',
      };
      sendMessage(activeContactId, 'Uploaded PDF document', media);
    }

    setShowAttachModal(false);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: PendingMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      const type = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'file';

      const formattedSize = file.size / (1024 * 1024) > 1 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(1) + ' KB';

      if (!isImg && file.size > 15 * 1024 * 1024) {
        showToast(`File "${file.name}" is too large (max 15MB)`);
        continue;
      }

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      let thumbnailUrl = '';
      let durationStr = '';
      if (isVid && dataUrl) {
        try {
          const meta = await extractVideoMetadata(dataUrl);
          thumbnailUrl = meta.thumbnailUrl;
          durationStr = meta.durationStr;
        } catch (err) {
          console.warn('Error extracting video metadata for selected file:', err);
        }
      }

      if (dataUrl) {
        newItems.push({
          id: 'p_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 7),
          file,
          type,
          url: dataUrl,
          name: file.name,
          sizeStr: formattedSize,
          thumbnailUrl,
          durationStr,
        });
      }
    }

    if (newItems.length > 0) {
      setPendingMediaList(prev => [...prev, ...newItems]);
      setActiveMediaIndex(0);
      setShowAttachModal(false);
    }

    e.target.value = '';
  };

  const sendPendingMediaList = async () => {
    if (pendingMediaList.length === 0 || !activeContactId) return;
    setIsUploadingMedia(true);
    setUploadProgress(10);

    try {
      for (let i = 0; i < pendingMediaList.length; i++) {
        const item = pendingMediaList[i];
        setUploadProgress(Math.round(((i + 0.5) / pendingMediaList.length) * 100));

        let finalDataUrl = item.url;
        if (item.type === 'image') {
          try {
            finalDataUrl = await compressImage(item.url, 1024, 450000);
          } catch (err) {
            console.warn('Compression failed, fallback to original image', err);
          }
        }

        const media: MediaAttachment = {
          id: 'attach_' + Date.now() + '_' + i,
          type: item.type,
          name: item.name,
          url: finalDataUrl,
          size: item.sizeStr,
          duration: item.durationStr,
          thumbnailUrl: item.thumbnailUrl,
          isViewOnce: Boolean(item.isViewOnce),
        };

        const captionText = (i === 0 && mediaCaption.trim()) 
          ? mediaCaption.trim() 
          : (item.type === 'image' ? '📷 Photo' : item.type === 'video' ? '🎥 Video' : item.type === 'audio' ? '🎵 Audio' : `Uploaded document: ${item.name}`);

        await sendMessage(activeContactId, captionText, media);
        setUploadProgress(Math.round(((i + 1) / pendingMediaList.length) * 100));
      }

      showToast(`${pendingMediaList.length} ${pendingMediaList.length === 1 ? 'file' : 'files'} sent`);
      setPendingMediaList([]);
      setMediaCaption('');
    } catch (err) {
      console.error('Error sending media:', err);
      showToast('Error sending media. Please try again.');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const handleShareLocation = () => {
    setShowAttachModal(false);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    showToast('Fetching location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const media: MediaAttachment = {
          id: 'loc_' + Date.now(),
          type: 'location',
          name: 'Current Location',
          url: `https://www.google.com/maps?q=${lat},${lng}`,
          locationData: {
            lat,
            lng,
            address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
          },
        };
        sendMessage(activeContactId, '📍 Shared location', media);
        showToast('Location shared');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        showToast('Unable to retrieve location');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectContactToShare = (targetContact: Contact) => {
    setShowContactPickerModal(false);
    setShowAttachModal(false);
    const media: MediaAttachment = {
      id: 'contact_' + Date.now(),
      type: 'contact',
      name: targetContact.name,
      url: targetContact.avatar || '',
      contactData: {
        id: targetContact.id,
        name: targetContact.name,
        phone: targetContact.username || targetContact.email || '+1 (555) 019-2834',
        avatar: targetContact.avatar,
      },
    };
    sendMessage(activeContactId, `👤 Contact: ${targetContact.name}`, media);
    showToast(`Shared contact ${targetContact.name}`);
  };

  const insertEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden relative font-sans select-none">
      
      {/* Main Conversation Pane */}
      <div className={`flex-1 flex flex-col overflow-hidden relative h-full min-h-0 transition-colors ${
        isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
      }`}>

        {/* Top Chat Header OR Message Selection Toolbar */}
        {isSelectMode ? (
          <MessageSelectionToolbar
            selectedMessages={curMessages.filter(m => selectedMsgIds.includes(m.id))}
            onClearSelection={() => {
              setSelectedMsgIds([]);
              setActiveReactionMsgId(null);
            }}
            onReply={handleReplySelection}
            onForward={handleForwardSelection}
            onDelete={handleDeleteSelection}
            onCopy={handleCopyMessage}
            onPin={handlePinMessage}
          />
        ) : (
          <div className={`px-3 py-2.5 flex items-center justify-between shrink-0 z-20 border-b transition-colors ${
            isDark ? 'bg-[#0b141a] border-[#1f2c34]/60 text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                id="vault_nav_back_trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveContactId(null);
                }}
                className={`p-1 rounded-full transition-colors mr-0.5 ${
                  isDark ? 'hover:bg-[#202c33] text-[#e9edef]' : 'hover:bg-gray-100 text-gray-700'
                }`}
                title="Back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${contact.id}`);
                }} 
                className="relative shrink-0 cursor-pointer group"
                title="View Profile"
              >
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className={`w-10 h-10 rounded-full object-cover transition-transform group-hover:scale-105 ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`}
                />
                {!contact.isGroup && contact.isOnline && (
                  <span className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 ${
                    isDark ? 'border-[#0b141a]' : 'border-white'
                  }`}></span>
                )}
              </div>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${contact.id}`);
                }} 
                className="min-w-0 ml-1 cursor-pointer"
                title="View Profile"
              >
                <h2 className={`font-semibold text-base flex items-center gap-1.5 truncate ${
                  isDark ? 'text-[#e9edef]' : 'text-gray-900'
                }`}>
                  <span className="truncate">{getContactDisplayName(contact)}</span>
                  {checkIsAdmin(contact) && <VerifiedBadge className="w-4 h-4 shrink-0" />}
                  {contact.isLocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </h2>
                {(() => {
                  if (contact.id === user.id || contact.isSelf) {
                    return (
                      <p className={`text-xs truncate ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                        Message yourself • Personal Notes
                      </p>
                    );
                  }

                  // Group Chat Subtitle
                  if (contact.isGroup) {
                    const memberList = getGroupMembersList(contact, allRegisteredUsers, contacts, user);
                    const memberCount = memberList.length;
                    const namesStr = memberList.map(m => m.name).join(', ');
                    return (
                      <p className={`text-xs truncate ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                        {memberCount} member{memberCount !== 1 ? 's' : ''}{namesStr ? `: ${namesStr}` : ''}
                      </p>
                    );
                  }

                  // 1. Typing Indicator (Pink)
                  if (contact.isTyping) {
                    return (
                      <p className="text-xs truncate text-pink-500 font-semibold animate-pulse">
                        {getContactDisplayName(contact)} is typing...
                      </p>
                    );
                  }

                  // 2. Online Status (Green)
                  if (contact.isOnline) {
                    return (
                      <p className="text-xs truncate text-emerald-500 font-medium">
                        Online
                      </p>
                    );
                  }

                  // 3. Last Seen Status (Gray)
                  return (
                    <p className={`text-xs truncate ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                      {formatLastSeen(contact.lastSeen)}
                    </p>
                  );
                })()}
              </div>
            </div>

            <div className={`flex items-center gap-2.5 relative ${isDark ? 'text-[#e9edef]' : 'text-gray-700'}`}>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (contact.id === user.id) {
                    showToast('You cannot call yourself in Message Yourself.');
                    return;
                  }
                  if (!isFriend(contact.id)) {
                    showToast('Become friends to start a call.');
                    return;
                  }
                  startCall(contact.id, 'video');
                }} 
                className="hover:opacity-80 p-1.5 rounded-full transition-colors text-[#00a8ff]"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (contact.id === user.id) {
                    showToast('You cannot call yourself in Message Yourself.');
                    return;
                  }
                  if (!isFriend(contact.id)) {
                    showToast('Become friends to start a call.');
                    return;
                  }
                  startCall(contact.id, 'voice');
                }} 
                className="hover:opacity-80 p-1.5 rounded-full transition-colors text-[#00a8ff]"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRightSidebar(true);
                }}
                className="hover:opacity-80 p-1.5 rounded-full transition-colors hidden lg:block"
                title="Contact details"
              >
                <Info className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHeaderMenu(!showHeaderMenu);
                }} 
                className="hover:opacity-80 p-1.5 rounded-full transition-colors"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* 3-Dots Dropdown Menu */}
              {showHeaderMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowHeaderMenu(false)} 
                  />
                  <div className={`absolute right-0 top-10 z-50 rounded-2xl shadow-2xl py-2 w-56 text-sm font-sans select-none animate-scale-in border transition-all ${
                    isDark 
                      ? 'bg-[#233138] border-[#2a3942] text-[#e9edef]' 
                      : 'bg-white border-gray-200 text-gray-800 shadow-xl'
                  }`}>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setShowNicknameModal(true);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Tag className="w-4.5 h-4.5 text-[#00a8ff]" />
                      <span className="text-[#00a8ff] font-semibold">{customNicknames[contact.id] ? 'Edit Custom Name' : 'Set Custom Name'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setShowWallpaperModal(true);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Image className="w-4.5 h-4.5 text-[#00a8ff]" />
                      <span className="font-semibold text-[#00a8ff]">Set Wallpaper</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setShowInChatSearch(true);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Search className="w-4.5 h-4.5 opacity-80" />
                      <span>Search messages</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setSelectedMsgIds([]);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <CheckSquare className="w-4.5 h-4.5 opacity-80" />
                      <span>Select messages</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        togglePinContact(contact.id);
                        showToast(contact.isPinned ? "Unpinned chat" : "Pinned chat");
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Pin className="w-4.5 h-4.5 opacity-80" />
                      <span>{contact.isPinned ? "Unpin chat" : "Pin chat"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        clearChatHistory(contact.id);
                        showToast("Cleared chat history");
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <MinusCircle className="w-4.5 h-4.5 opacity-80" />
                      <span>Clear messages</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setActiveContactId(null);
                        showToast("Chat closed");
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <XCircle className="w-4.5 h-4.5 opacity-80" />
                      <span>Close chat</span>
                    </button>

                    {isFriend(contact.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowHeaderMenu(false);
                          setShowUnfriendConfirmModal(true);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-rose-500 font-semibold ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Ban className="w-4.5 h-4.5" />
                        <span>Unfriend Contact</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        if (blockedContactIds.includes(contact.id)) {
                          unblockContact(contact.id);
                          showToast(`Unblocked ${contact.name}`);
                        } else {
                          blockContact(contact.id);
                          showToast(`${contact.name} blocked`);
                          setActiveContactId(null);
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        blockedContactIds.includes(contact.id) ? 'text-emerald-500 font-semibold' : 'text-amber-500'
                      } ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'}`}
                    >
                      <Ban className="w-4.5 h-4.5 opacity-80" />
                      <span>{blockedContactIds.includes(contact.id) ? `Unblock ${contact.name}` : `Block contact`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        showToast(`Reported ${contact.name}`);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-red-500 font-semibold ${
                        isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Flag className="w-4.5 h-4.5 text-red-500" />
                      <span>Report</span>
                    </button>

                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pinned Message Banner */}
        {pinnedMessage && (
          <PinnedMessageBanner
            pinnedMessage={pinnedMessage}
            isDark={isDark}
            onScrollToMessage={scrollToMessage}
            onUnpin={(msgId) => {
              togglePinMessage(contact.id, msgId);
              showToast("Message unpinned");
            }}
          />
        )}

        {/* Search in Chat Overlay */}
        {showInChatSearch && (
          <div className={`px-4 py-2 flex items-center gap-2 border-b animate-fade-in ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-100 border-gray-200'
          }`}>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              placeholder="Search messages in chat..."
              className={`w-full bg-transparent border-none outline-none text-sm ${
                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
              autoFocus
            />
            <button 
              type="button"
              onClick={() => {
                setShowInChatSearch(false);
                setInChatSearchQuery('');
              }}
              className="p-1 rounded-full hover:bg-gray-500/20 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}



        {/* Messages View Area */}
        <div 
          onClick={() => {
            if (selectedMsgIds.length > 0 || activeReactionMsgId) {
              setSelectedMsgIds([]);
              setActiveReactionMsgId(null);
            }
          }}
          className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar min-h-0 transition-all ${
            isCustomImage || isCustomColor ? '' : (isDark ? 'bg-[#0b141a]/60 bg-cover bg-center bg-no-repeat' : 'bg-[#efeae2]')
          }`}
          style={{
            ...(isCustomImage ? {
              backgroundImage: `url("${chatWallpaper}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : (!isCustomColor && isDark) ? {
              backgroundImage: "url('/dark_blocks_bg.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : {}),
            ...(isCustomColor ? {
              backgroundColor: chatWallpaper,
            } : {}),
          }}
        >
          {curMessages.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center text-xs px-6 ${
              isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
              <div className={`p-3.5 rounded-2xl mb-3 border ${
                isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-white border-gray-200'
              }`}>
                <Lock className="w-6 h-6 text-[#00a8ff]" />
              </div>
              <p className={`font-semibold text-sm ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>End-to-End Encrypted</p>
              <p className={`max-w-xs mt-1 text-xs ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>Messages stay private and synchronized across all devices.</p>
            </div>
          ) : (
            (() => {
              const displayedMsgs = inChatSearchQuery.trim() 
                ? curMessages.filter(m => m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase())) 
                : curMessages;

              let lastDateLabel = '';

              return displayedMsgs.map(msg => {
                const rawTimestamp = msg.createdAt || msg.timestamp;
                const dateLabel = formatChatDate(rawTimestamp);
                const showSeparator = dateLabel !== lastDateLabel;
                if (showSeparator) {
                  lastDateLabel = dateLabel;
                }

                const isMe = msg.senderId === user.id;
                const isSelected = selectedMsgIds.includes(msg.id);
                const speed = audioPlaybackSpeeds[msg.id] || 1;
                const formattedTime = formatMessageTime(rawTimestamp, msg.timestamp);

                return (
                  <React.Fragment key={msg.id}>
                    {showSeparator && (
                      <DateSeparator dateLabel={dateLabel} isDark={isDark} />
                    )}
                    <div
                      id={`msg_${msg.id}`}
                      className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} relative my-1`}
                    >
                      {activeReactionMsgId === msg.id && (
                        <EmojiReactionBar
                          isDark={isDark}
                          currentReaction={msg.reactions?.[authUser?.uid || user.id]}
                          onSelectEmoji={(emoji) => handleSelectReaction(msg.id, emoji)}
                          onClose={() => setActiveReactionMsgId(null)}
                        />
                      )}

                      {/* Swipeable Message Bubble Wrapper */}
                      <div className="relative max-w-[85%] sm:max-w-[75%]">
                        {/* Swipe to Reply Icon Indicator */}
                        {swipingMsgId === msg.id && swipeOffset > 3 && (
                          <div 
                            className="absolute -left-9 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-[#ea4c89] text-white shadow-md pointer-events-none z-10"
                            style={{
                              opacity: Math.min(swipeOffset / 30, 1),
                              transform: `translateY(-50%) scale(${Math.min(0.5 + (swipeOffset / 45) * 0.5, 1.1)})`
                            }}
                          >
                            <CornerUpLeft className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}

                        <div
                          onTouchStart={(e) => handleTouchStartMessage(e, msg)}
                          onTouchMove={(e) => handleTouchMoveMessage(e, msg)}
                          onTouchEnd={() => handleTouchEndMessage(msg)}
                          onTouchCancel={() => handleTouchEndMessage(msg)}
                          style={{
                            transform: swipingMsgId === msg.id ? `translateX(${swipeOffset}px)` : 'translateX(0px)',
                            transition: swipingMsgId === msg.id ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isSelectMode) {
                              setSelectedMsgIds([msg.id]);
                              setActiveReactionMsgId(msg.id);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelectMode) {
                              if (isSelected) {
                                const remaining = selectedMsgIds.filter(id => id !== msg.id);
                                setSelectedMsgIds(remaining);
                                if (activeReactionMsgId === msg.id || remaining.length === 0) {
                                  setActiveReactionMsgId(null);
                                }
                              } else {
                                setSelectedMsgIds([...selectedMsgIds, msg.id]);
                              }
                            } else if (activeReactionMsgId) {
                              setActiveReactionMsgId(null);
                            }
                          }}
                          className={`w-full px-4 py-2.5 text-sm relative shadow-sm transition-all select-none ${
                            isMe ? 'rounded-[20px] rounded-br-[3px]' : 'rounded-[20px] rounded-bl-[3px]'
                          } ${
                            isSelectMode ? 'cursor-pointer' : ''
                          } ${
                            isSelected ? 'ring-2 ring-pink-500 bg-pink-500/20 scale-[1.01]' : ''
                          } ${
                            highlightedMsgId === msg.id ? 'ring-2 ring-pink-500 bg-pink-500/20 animate-pulse' : ''
                          } ${
                            isMe
                              ? 'bg-[#ea4c89] text-white shadow-pink-500/10'
                              : (isDark ? 'bg-[#202c33] text-[#e9edef]' : 'bg-white text-gray-900 border border-gray-100')
                          }`}
                        >
                    {/* Speech Bubble Tail - Outgoing */}
                    {isMe && (
                      <svg
                        className="absolute -bottom-[1px] -right-[6px] w-3.5 h-3.5 text-[#ea4c89] fill-current pointer-events-none drop-shadow-xs"
                        viewBox="0 0 10 10"
                      >
                        <path d="M0 0 L10 0 C6 3 4 7 0 10 Z" />
                      </svg>
                    )}

                    {/* Speech Bubble Tail - Incoming (Image 2 style) */}
                    {!isMe && (
                      <svg
                        className={`absolute -bottom-[1px] -left-[6px] w-3.5 h-3.5 fill-current pointer-events-none drop-shadow-xs ${
                          isDark ? 'text-[#202c33]' : 'text-white'
                        }`}
                        viewBox="0 0 10 10"
                      >
                        <path d="M10 0 L0 0 C4 3 6 7 10 10 Z" />
                      </svg>
                    )}
                    {msg.deletedForEveryone ? (
                      <div className="py-1 px-1 flex items-center gap-2 text-[#8596a0] italic text-xs select-none min-w-[160px]">
                        <Ban className="w-4 h-4 text-[#8596a0] shrink-0" />
                        <span>{isMe ? 'You deleted this message' : 'This message was deleted'}</span>
                      </div>
                    ) : (
                      <>
                        {/* Forwarded Header Indicator */}
                        {msg.isForwarded && (
                          <div className={`flex items-center gap-1.5 text-[13px] italic mb-1 select-none ${
                            isMe ? 'text-white/85' : (isDark ? 'text-[#8696a0]' : 'text-[#667781]')
                          }`}>
                            <svg 
                              viewBox="0 0 20 16" 
                              className="w-4 h-4 shrink-0 fill-current opacity-90"
                            >
                              <path d="M3 13.5C3 9 6.2 6.5 11.5 6.5V3L17.5 8L11.5 13V9.5C8 9.5 5 10.5 3 13.5Z" />
                              <path d="M13 3L19 8L13 13V10.5L16 8L13 5.5V3Z" />
                            </svg>
                            <span className="font-normal tracking-tight">Forwarded</span>
                          </div>
                        )}

                        {/* Group Member Sender Name */}
                        {contact?.isGroup && !isMe && (
                          <div className="text-[11px] font-bold text-[#ea4c89] mb-1 truncate flex items-center gap-1">
                            <span className="truncate">{msg.senderName || 'Group Member'}</span>
                            {checkIsAdmin(msg.senderId || msg.senderName) && <VerifiedBadge className="w-3.5 h-3.5 shrink-0 text-[#00a8ff]" />}
                          </div>
                        )}

                        {/* Status Reply Card - WhatsApp Style */}
                        {msg.statusReply && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.statusReply?.statusId) {
                                handleOpenStatusFromReply(msg.statusReply.statusId, msg.statusReply.statusOwnerId);
                              }
                            }}
                            className={`p-2.5 rounded-xl border-l-[4px] mb-2.5 text-xs flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all overflow-hidden ${
                              isMe
                                ? 'bg-black/20 border-white text-white hover:bg-black/30'
                                : (isDark ? 'bg-[#111b21] border-[#ea4c89] text-[#e9edef] hover:bg-[#182229]' : 'bg-[#f0f2f5] border-[#ea4c89] text-gray-900 hover:bg-gray-200/80')
                            }`}
                            title="Click to view full status"
                          >
                            <div className="flex-1 min-w-0 pr-1">
                              <div className={`font-semibold text-[12px] truncate flex items-center gap-1.5 ${
                                isMe ? 'text-white' : 'text-[#ea4c89] dark:text-[#ff7b61]'
                              }`}>
                                <span className="font-bold truncate">{msg.statusReply.statusOwnerName || 'User'}</span>
                                <span className="opacity-75 font-normal text-[11px] shrink-0">· Status</span>
                              </div>
                              <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 truncate ${
                                isMe ? 'text-white/85' : 'text-gray-600 dark:text-[#8696a0]'
                              }`}>
                                {(msg.statusReply.statusType === 'video' || msg.statusReply.statusMediaType === 'video') ? (
                                  <>
                                    <Video className={`w-3.5 h-3.5 shrink-0 inline ${isMe ? 'text-white' : 'text-[#ea4c89] dark:text-[#ff7b61]'}`} />
                                    <span className="truncate font-medium">{msg.statusReply.statusText || 'Video'}</span>
                                  </>
                                ) : (msg.statusReply.statusType === 'image' || msg.statusReply.statusMediaType === 'image' || msg.statusReply.statusThumbnail || msg.statusReply.statusMediaUrl) ? (
                                  <>
                                    <Camera className={`w-3.5 h-3.5 shrink-0 inline ${isMe ? 'text-white' : 'text-[#ea4c89] dark:text-[#ff7b61]'}`} />
                                    <span className="truncate font-medium">{msg.statusReply.statusText || 'Photo'}</span>
                                  </>
                                ) : (
                                  <span className="truncate font-medium">{msg.statusReply.statusText || 'Status'}</span>
                                )}
                              </div>
                            </div>

                            {(msg.statusReply.statusThumbnail || msg.statusReply.statusMediaUrl) ? (
                              <img
                                src={msg.statusReply.statusThumbnail || msg.statusReply.statusMediaUrl}
                                alt="Status preview"
                                className="w-12 h-12 object-cover rounded-lg shrink-0 border border-black/10 dark:border-white/20 shadow-xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0 text-white font-bold text-[10px] p-1 text-center truncate shadow-xs">
                                Status
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Reaction Card - WhatsApp Style */}
                        {msg.statusReaction && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.statusReaction?.statusId) {
                                handleOpenStatusFromReply(msg.statusReaction.statusId, msg.statusReaction.statusOwnerId);
                              }
                            }}
                            className={`p-2.5 rounded-xl border-l-[4px] mb-2.5 text-xs flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all overflow-hidden ${
                              isMe
                                ? 'bg-black/20 border-white text-white hover:bg-black/30'
                                : (isDark ? 'bg-[#111b21] border-[#ea4c89] text-[#e9edef] hover:bg-[#182229]' : 'bg-[#f0f2f5] border-[#ea4c89] text-gray-900 hover:bg-gray-200/80')
                            }`}
                            title="Click to view full status"
                          >
                            <div className="flex-1 min-w-0 pr-1">
                              <div className={`font-semibold text-[12px] truncate flex items-center gap-1.5 ${
                                isMe ? 'text-white' : 'text-[#ea4c89] dark:text-[#ff7b61]'
                              }`}>
                                <span className="font-bold truncate">{msg.statusReaction.statusOwnerName || 'User'}</span>
                                <span className="opacity-75 font-normal text-[11px] shrink-0">· Status</span>
                              </div>
                              <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 truncate ${
                                isMe ? 'text-white/85' : 'text-gray-600 dark:text-[#8696a0]'
                              }`}>
                                <span className="shrink-0 text-sm leading-none">{msg.statusReaction.emoji}</span>
                                {(msg.statusReaction.statusType === 'video' || msg.statusReaction.statusMediaType === 'video') ? (
                                  <>
                                    <Video className={`w-3.5 h-3.5 shrink-0 inline ${isMe ? 'text-white' : 'text-[#ea4c89] dark:text-[#ff7b61]'}`} />
                                    <span className="truncate font-medium">{msg.statusReaction.statusText || 'Video'}</span>
                                  </>
                                ) : (msg.statusReaction.statusType === 'image' || msg.statusReaction.statusMediaType === 'image' || msg.statusReaction.statusThumbnail || msg.statusReaction.statusMediaUrl) ? (
                                  <>
                                    <Camera className={`w-3.5 h-3.5 shrink-0 inline ${isMe ? 'text-white' : 'text-[#ea4c89] dark:text-[#ff7b61]'}`} />
                                    <span className="truncate font-medium">{msg.statusReaction.statusText || 'Photo'}</span>
                                  </>
                                ) : (
                                  <span className="truncate font-medium">{msg.statusReaction.statusText || 'Status'}</span>
                                )}
                              </div>
                            </div>

                            {(msg.statusReaction.statusThumbnail || msg.statusReaction.statusMediaUrl) ? (
                              <img
                                src={msg.statusReaction.statusThumbnail || msg.statusReaction.statusMediaUrl}
                                alt="Status preview"
                                className="w-12 h-12 object-cover rounded-lg shrink-0 border border-black/10 dark:border-white/20 shadow-xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0 text-white font-bold text-[10px] p-1 text-center truncate shadow-xs">
                                Status
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quoted Reply Context */}
                        {msg.replyTo && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.replyTo?.id) {
                                scrollToMessage(msg.replyTo.id);
                              }
                            }}
                            className={`p-2 rounded-lg border-l-4 mb-2 text-xs border-[#00a8ff] cursor-pointer hover:opacity-90 transition-opacity ${
                              isDark ? 'bg-black/20' : 'bg-black/5'
                            }`}
                          >
                            <p className="font-semibold text-[#00a8ff]">{msg.replyTo.senderName}</p>
                            <p className="truncate opacity-80 flex items-center gap-1">
                              {msg.replyTo.text === 'This message was deleted' || msg.replyTo.text.includes('deleted') ? (
                                <span className="italic text-gray-400 flex items-center gap-1">
                                  <Ban className="w-3 h-3 text-gray-400 inline" /> Deleted message
                                </span>
                              ) : (
                                renderTextWithLinks(msg.replyTo.text)
                              )}
                            </p>
                          </div>
                        )}

                        {/* Attached Media Render */}
                        {msg.media && (
                          <div className="mb-2 mt-0.5 overflow-hidden rounded-xl bg-black/30 border border-white/5">
                            {msg.media.isViewOnce ? (
                              <div className="p-1">
                                {(msg.media.opened || msg.opened) ? (
                                  /* Opened View Once Card */
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showToast('This photo/video has expired');
                                    }}
                                    className={`p-3 rounded-xl flex items-center gap-3 select-none cursor-pointer transition-colors ${
                                      isMe ? 'bg-white/10 text-white/80' : 'bg-black/20 text-[#8596a0]'
                                    }`}
                                  >
                                    <div className="w-8 h-8 rounded-full border border-gray-400/50 flex items-center justify-center text-xs font-bold shrink-0 text-gray-400">
                                      1
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-xs flex items-center gap-1.5">
                                        <span>{msg.media.type === 'video' ? 'Video' : 'Photo'}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-500/20 text-gray-400 font-normal">Opened</span>
                                      </div>
                                      <p className="text-[11px] opacity-70">Expired</p>
                                    </div>
                                  </div>
                                ) : (
                                  /* Unopened View Once Card */
                                  <div 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (isMe) {
                                        showToast(`You sent a view once ${msg.media?.type === 'video' ? 'video' : 'photo'}`);
                                        return;
                                      }
                                      if (msg.media) {
                                        setViewOnceActiveMedia({ msg, media: msg.media });
                                        await markViewOnceOpened(contact.id, msg.id);
                                      }
                                    }}
                                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all active:scale-98 ${
                                      isMe 
                                        ? 'bg-white/15 hover:bg-white/20 text-white' 
                                        : 'bg-[#111b21] hover:bg-[#1f2c34] text-[#e9edef]'
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-full border-2 border-[#00a8ff] bg-[#00a8ff]/20 flex items-center justify-center font-extrabold text-xs text-[#00a8ff] shrink-0 shadow">
                                      1
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-xs flex items-center gap-1.5 text-[#00a8ff]">
                                        <span>{msg.media.type === 'video' ? 'Video' : 'Photo'}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00a8ff]/20 text-[#00a8ff] font-medium">View Once</span>
                                      </div>
                                      <p className="text-[11px] text-[#8596a0] font-medium truncate mt-0.5">
                                        {isMe ? 'Sent • Recipient can view 1 time' : 'Tap to view photo/video'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {msg.media.type === 'image' && (
                                  <img
                                    src={msg.media.url}
                                    alt={msg.media.name}
                                    onClick={() => setPreviewMedia({ url: msg.media!.url, type: 'image', name: msg.media!.name })}
                                    className="max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  />
                                )}

                                {msg.media.type === 'video' && (
                                  <VideoMessagePlayer
                                    src={msg.media.url}
                                    mediaId={msg.media.id}
                                    thumbnailUrl={msg.media.thumbnailUrl}
                                    duration={msg.media.duration}
                                    name={msg.media.name}
                                    isMe={isMe}
                                    onOpenLightbox={(url) => setPreviewMedia({ url, type: 'video', name: msg.media?.name })}
                                  />
                                )}
                              </>
                            )}

                            {msg.media.type === 'audio' && (() => {
                              const isPlayingThis = playingAudioMsgId === msg.id;
                              const prog = audioProgress[msg.id];
                              const currentTime = isPlayingThis && prog ? prog.currentTime : 0;
                              const totalDuration = prog && prog.duration ? prog.duration : 0;
                              const percent = isPlayingThis && totalDuration > 0 
                                ? Math.min(100, (currentTime / totalDuration) * 100) 
                                : 0;
                              const speed = audioPlaybackSpeeds[msg.id] || 1;

                              const formatSecs = (s: number) => {
                                if (!s || isNaN(s)) return '0:00';
                                const m = Math.floor(s / 60);
                                const sec = Math.floor(s % 60);
                                return `${m}:${sec < 10 ? '0' : ''}${sec}`;
                              };

                              const waveformHeights = [30, 60, 40, 85, 55, 95, 70, 45, 90, 65, 35, 80, 50, 100, 65, 40, 75, 45, 85, 50];

                              const handleWaveformSeek = (e: React.MouseEvent<HTMLDivElement>) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const ratio = Math.max(0, Math.min(1, clickX / rect.width));

                                if (playingAudioMsgId === msg.id && audioElementRef.current) {
                                  const newTime = ratio * (audioElementRef.current.duration || 0);
                                  audioElementRef.current.currentTime = newTime;
                                  setAudioProgress(prev => ({
                                    ...prev,
                                    [msg.id]: {
                                      currentTime: newTime,
                                      duration: audioElementRef.current?.duration || 1,
                                    }
                                  }));
                                } else {
                                  setPlayingAudioMsgId(msg.id);
                                  setTimeout(() => {
                                    if (audioElementRef.current) {
                                      const newTime = ratio * (audioElementRef.current.duration || 0);
                                      audioElementRef.current.currentTime = newTime;
                                    }
                                  }, 100);
                                }
                              };

                              return (
                                <div className="p-3 flex items-center gap-3 min-w-[240px]">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (playingAudioMsgId === msg.id) {
                                        if (audioElementRef.current) {
                                          audioElementRef.current.pause();
                                        }
                                        setPlayingAudioMsgId(null);
                                      } else {
                                        setPlayingAudioMsgId(msg.id);
                                      }
                                    }}
                                    className="w-10 h-10 rounded-full bg-[#00a8ff] text-[#0b141a] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow"
                                    title={isPlayingThis ? "Pause" : "Play Voice Note"}
                                  >
                                    {isPlayingThis ? (
                                      <Pause className="w-5 h-5 fill-current" />
                                    ) : (
                                      <Play className="w-5 h-5 fill-current ml-0.5" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1 min-w-0">
                                    {/* Waveform Bar */}
                                    <div 
                                      onClick={handleWaveformSeek}
                                      className="h-7 flex items-end gap-[2px] cursor-pointer mb-1 group/wave"
                                      title="Click to seek"
                                    >
                                      {waveformHeights.map((h, idx) => {
                                        const barPercent = (idx / waveformHeights.length) * 100;
                                        const isFilled = barPercent <= percent;
                                        return (
                                          <div
                                            key={idx}
                                            className={`flex-1 rounded-full transition-colors ${
                                              isFilled ? 'bg-[#00a8ff]' : 'bg-white/30 group-hover/wave:bg-white/50'
                                            }`}
                                            style={{ height: `${h}%` }}
                                          />
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-[#8596a0] font-mono">
                                      <span>{isPlayingThis ? formatSecs(currentTime) : (msg.media.duration || '0:15')}</span>
                                      <span className="flex items-center gap-1">
                                        <Mic className="w-3 h-3 text-[#00a8ff]" /> Voice Note
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAudioSpeed(msg.id);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-[10px] font-bold text-[#e9edef] transition-colors cursor-pointer border border-white/10 shrink-0"
                                  >
                                    {speed}x
                                  </button>
                                </div>
                              );
                            })()}

                            {msg.media.type === 'file' && (
                              <div className="p-3 flex items-center justify-between gap-3 min-w-[220px]">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="p-2.5 bg-[#00a8ff]/20 text-[#00a8ff] rounded-xl shrink-0 font-mono text-xs font-bold">
                                    <File className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold truncate text-sm text-[#e9edef]">{msg.media.name}</p>
                                    <p className="text-xs text-[#8596a0] font-mono">{msg.media.size || '1.2 MB'}</p>
                                  </div>
                                </div>
                                <a
                                  href={msg.media.url}
                                  download={msg.media.name}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#00a8ff] transition-colors shrink-0"
                                  title="Download File"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}

                            {msg.media.type === 'location' && (
                              <div className="p-3 flex flex-col gap-2 min-w-[240px]">
                                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-xs">
                                  <MapPin className="w-5 h-5 shrink-0" />
                                  <span>{msg.media.name || 'Shared Location'}</span>
                                </div>
                                {msg.media.locationData?.address && (
                                  <p className="text-xs text-gray-300 font-mono pl-7">{msg.media.locationData.address}</p>
                                )}
                                <a
                                  href={msg.media.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <span>View on Google Maps</span>
                                </a>
                              </div>
                            )}

                            {msg.media.type === 'contact' && (
                              <div className="p-3 flex flex-col gap-3 min-w-[230px]">
                                <div className="flex items-center gap-3">
                                  {msg.media.contactData?.avatar ? (
                                    <img src={msg.media.contactData.avatar} alt="Contact" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                      <User className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-[#e9edef] truncate">{msg.media.contactData?.name || msg.media.name}</p>
                                    <p className="text-xs text-[#8596a0] truncate">{msg.media.contactData?.phone || 'Contact Details'}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (msg.media?.contactData?.id) {
                                      setActiveContactId(msg.media.contactData.id);
                                    } else {
                                      showToast(`Contact card for ${msg.media?.contactData?.name || msg.media?.name}`);
                                    }
                                  }}
                                  className="w-full py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-semibold text-center transition-colors"
                                >
                                  Message Contact
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Call Card Render */}
                        {(msg.callInfo || msg.type === 'voice_call' || msg.type === 'video_call') && (
                          <div className="my-1.5 p-3 rounded-2xl bg-black/20 border border-white/10 flex flex-col gap-2.5 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-full shrink-0 ${
                                msg.callInfo?.status === 'missed' || msg.callInfo?.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {msg.type === 'video_call' || msg.callInfo?.type === 'video' ? (
                                  <Video className="w-5 h-5" />
                                ) : (
                                  <Phone className="w-5 h-5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm flex items-center gap-1.5 text-white truncate">
                                  {msg.callInfo?.type === 'video' || msg.type === 'video_call' ? 'Video Call' : 'Voice Call'}
                                  {msg.callInfo?.status === 'missed' && <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-500/20">Missed</span>}
                                  {msg.callInfo?.status === 'rejected' && <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-500/20">Rejected</span>}
                                </h4>

                                <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                                  <span>{msg.callInfo?.direction === 'outgoing' || isMe ? 'Outgoing' : 'Incoming'}</span>
                                  {msg.callInfo?.duration && msg.callInfo.duration !== '00:00' && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">{msg.callInfo.duration}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startCall(contact.id, msg.callInfo?.type || (msg.type === 'video_call' ? 'video' : 'voice'));
                              }}
                              className="w-full py-1.5 px-3 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Call Again</span>
                            </button>
                          </div>
                        )}

                        {/* Message Text */}
                        {!(msg.callInfo || msg.type === 'voice_call' || msg.type === 'video_call') && (
                          <p className="leading-normal whitespace-pre-wrap break-words text-[15px]">{renderTextWithLinks(msg.text)}</p>
                        )}
                      </>
                    )}

                    {/* Footer Timestamp & Status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isMe ? 'text-white/85' : 'text-[#8596a0]'}`}>
                      {msg.isStarred && !msg.deletedForEveryone && <Star className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />}
                      {msg.isEdited && !msg.deletedForEveryone && <span className="italic text-[9px] opacity-80">edited</span>}
                      <span>{formattedTime}</span>

                      {/* Delivery Status Indicator */}
                      {isMe && (
                        (msg.isRead || msg.seen) ? (
                          <CheckCheck className="w-4 h-4 text-[#34b7f1] shrink-0 font-extrabold drop-shadow-xs stroke-[2.5]" />
                        ) : (msg.isDelivered || msg.isSent) ? (
                          <CheckCheck className="w-3.5 h-3.5 text-white/70 shrink-0 stroke-[2]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/70 shrink-0 stroke-[2]" />
                        )
                      )}
                    </div>

                    {/* Quick Hover Action Menu Trigger */}
                    {!msg.deletedForEveryone ? (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/40 rounded-lg p-0.5 backdrop-blur-sm">
                        <button
                          onClick={() => setReplyingToMsg(msg)}
                          className="p-1 hover:bg-white/20 rounded text-white"
                          title="Reply"
                        >
                          <CornerUpLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleStarMessage(contact.id, msg.id)}
                          className="p-1 hover:bg-white/20 rounded text-amber-300"
                          title="Star"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setForwardingMsg(msg);
                            setForwardContactIds([]);
                          }}
                          className="p-1 hover:bg-white/20 rounded text-white"
                          title="Forward"
                        >
                          <Forward className="w-3 h-3" />
                        </button>

                        {isMe && isMessageEditable(msg) && (
                          <button
                            onClick={() => {
                              setEditingMsg(msg);
                              setInputText(msg.text);
                            }}
                            className="p-1 hover:bg-white/20 rounded text-emerald-300"
                            title="Edit (Available within 2 mins)"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModalMsg(msg);
                            setDeleteConfirmType(null);
                          }}
                          className="p-1 hover:bg-white/20 rounded text-rose-300"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/40 rounded-lg p-0.5 backdrop-blur-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModalMsg(msg);
                            setDeleteConfirmType(null);
                          }}
                          className="p-1 hover:bg-white/20 rounded text-rose-300"
                          title="Delete for me"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Reactions badge */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                        }}
                        className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-0.5 ${
                          isDark ? 'bg-[#202c33] border-[#2a3942] text-white' : 'bg-white border-gray-200 text-gray-800'
                        } border rounded-full px-1.5 py-0.5 text-xs shadow-md z-10 cursor-pointer hover:scale-105 transition-transform`}
                      >
                        {Array.from(new Set(Object.values(msg.reactions))).slice(0, 3).map((emoji, idx) => (
                          <span key={idx}>{emoji}</span>
                        ))}
                        {Object.keys(msg.reactions).length > 1 && (
                          <span className="text-[10px] opacity-80 font-semibold ml-0.5">
                            {Object.keys(msg.reactions).length}
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
              </React.Fragment>
            );
          });
        })()
      )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying Banner above Input */}
        {replyingToMsg && (
          <div className={`px-4 py-2 flex items-center justify-between border-t border-[#00a8ff]/30 text-xs animate-fade-in ${
            isDark ? 'bg-[#182229] text-[#e9edef]' : 'bg-sky-50 text-sky-900'
          }`}>
            <div className="flex items-center gap-2 border-l-2 border-[#00a8ff] pl-2 truncate">
              <CornerUpLeft className="w-3.5 h-3.5 text-[#00a8ff] shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-[#00a8ff] block">
                  Replying to {replyingToMsg.senderId === user.id ? 'yourself' : contact.name}
                </span>
                <span className="truncate block opacity-80">{renderTextWithLinks(replyingToMsg.text)}</span>
              </div>
            </div>
            <button onClick={() => setReplyingToMsg(null)} className="p-1 hover:bg-black/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing Banner above Input */}
        {editingMsg && (
          <div className={`px-4 py-2 flex items-center justify-between border-t border-amber-500/30 text-xs animate-fade-in ${
            isDark ? 'bg-[#182229] text-[#e9edef]' : 'bg-amber-50 text-amber-900'
          }`}>
            <div className="flex items-center gap-2 border-l-2 border-amber-500 pl-2 truncate">
              <Edit3 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-amber-500">Editing message</span>
            </div>
            <button onClick={() => { setEditingMsg(null); setInputText(''); }} className="p-1 hover:bg-black/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Voice Note Recorder Tray */}
        {isRecording ? (
          <div className={`p-3 flex items-center justify-between gap-3 border-t animate-fade-in z-20 ${
            isDark ? 'bg-[#111b21] border-[#222e35]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 text-rose-500 font-mono font-bold text-sm">
              <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping shrink-0" />
              <span>
                {Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePauseRecording}
                className="p-2.5 rounded-full bg-[#202c33] text-white hover:bg-[#2a3942] transition-colors"
                title={isRecordingPaused ? "Resume" : "Pause"}
              >
                {isRecordingPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleCancelRecording}
                className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                title="Discard"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleSendRecording}
                className="p-2.5 rounded-full bg-[#00a8ff] text-[#0b141a] hover:bg-[#0088cc] transition-colors font-bold"
                title="Send Voice Note"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
        ) : !isFriend(contact.id) ? (
          <div className={`p-4 border-t flex items-center justify-between gap-3 text-xs font-semibold shrink-0 z-20 ${
            isDark ? 'bg-[#182229] border-[#2a3942] text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You must be friends to chat.</span>
            </div>

            <div className="shrink-0">
              {sentFriendRequests.some(r => r.receiverId === contact.id && r.status === 'pending') ? (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Request Sent
                </span>
              ) : (() => {
                const incoming = pendingFriendRequests.find(r => r.senderId === contact.id && r.status === 'pending');
                if (incoming) {
                  return (
                    <button
                      type="button"
                      onClick={async () => {
                        await acceptFriendRequest(incoming.id, contact.id);
                        showToast('🎉 You are now friends!');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0b141a] font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Accept Request
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={async () => {
                      await sendFriendRequest(contact.id);
                      showToast('Friend request sent.');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-xs flex items-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Friend
                  </button>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full z-20">
            {/* Attachment Options Popover */}
            {showAttachModal && (
              <div className={`p-4 border-t animate-slide-up grid grid-cols-3 gap-3 shadow-2xl justify-items-center ${
                isDark ? 'bg-[#111b21] border-[#222e35]' : 'bg-white border-gray-200'
              }`}>
                {/* Photos */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 p-2 text-xs hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow">
                    <Image className="w-6 h-6" />
                  </div>
                  <span className={isDark ? 'text-gray-300 font-medium' : 'text-gray-700 font-medium'}>Photos</span>
                </button>

                {/* Video */}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 p-2 text-xs hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow">
                    <Video className="w-6 h-6" />
                  </div>
                  <span className={isDark ? 'text-gray-300 font-medium' : 'text-gray-700 font-medium'}>Video</span>
                </button>

                {/* Camera */}
                <button
                  type="button"
                  onClick={() => openCameraModal('user')}
                  className="flex flex-col items-center gap-1.5 p-2 text-xs hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-sky-500/20 text-[#00a8ff] flex items-center justify-center border border-sky-500/30 shadow">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className={isDark ? 'text-gray-300 font-medium' : 'text-gray-700 font-medium'}>Camera</span>
                </button>
              </div>
            )}

            {/* Emoji Picker Tray */}
            {showEmojiPicker && (
              <div className={`p-3 border-t animate-slide-up flex flex-col h-64 max-h-72 shadow-2xl transition-all ${
                isDark ? 'bg-[#111b21] border-[#222e35]' : 'bg-slate-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-500/20 px-1">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-[#00a8ff]" />
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                      Select Emoji ({EMOJI_LIST.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-gray-500/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 gap-1.5 p-1 no-scrollbar select-none">
                  {EMOJI_LIST.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(prev => prev + emoji);
                      }}
                      className="text-2xl p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-[#202c33] hover:scale-125 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Input Bar or Blocked Notice */}
            {(blockedContactIds.includes(contact.id) || blockedByContactIds.includes(contact.id)) ? (
              <div className={`p-4 text-center flex flex-col items-center justify-center gap-2 border-t shrink-0 ${
                isDark ? 'bg-[#111b21] border-[#1f2c34] text-[#8696a0]' : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}>
                <p className="text-xs font-medium">
                  {blockedContactIds.includes(contact.id)
                    ? "You blocked this contact. Tap below to unblock."
                    : "You cannot send messages to this contact."}
                </p>
                {blockedContactIds.includes(contact.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      unblockContact(contact.id);
                      showToast(`Unblocked ${contact.name}`);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Unblock Contact
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSend} className={`p-2 flex items-center gap-2 shrink-0 transition-colors ${
                isDark ? 'bg-[#0b141a]' : 'bg-gray-100 border-t border-gray-200'
              }`}>
                <div className={`flex-1 rounded-full flex items-center px-3 py-1.5 gap-2 border ${
                  isDark ? 'bg-[#202c33] border-transparent' : 'bg-white border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAttachModal(false);
                    }}
                    className={`p-1.5 transition-colors ${
                      showEmojiPicker 
                        ? 'text-[#00a8ff]' 
                        : (isDark ? 'text-[#8596a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-800')
                    }`}
                    title="Emojis"
                  >
                    <Smile className="w-6 h-6" />
                  </button>

                  <input
                    type="text"
                    placeholder="Message"
                    value={inputText}
                    onChange={handleInputChange}
                    className={`flex-1 bg-transparent focus:outline-none text-base py-1 ${
                      isDark ? 'text-[#e9edef] placeholder-[#8596a0]' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachModal(!showAttachModal);
                      setShowEmojiPicker(false);
                    }}
                    className={`p-1.5 transition-colors -rotate-45 ${
                      showAttachModal 
                        ? 'text-[#00a8ff]' 
                        : (isDark ? 'text-[#8596a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-800')
                    }`}
                    title="Attach"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('gallery')}
                    className={`p-1.5 transition-colors hidden sm:block ${
                      isDark ? 'text-[#8596a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Camera"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="bg-[#00a8ff] hover:bg-[#0088cc] active:scale-95 text-[#0b141a] w-11 h-11 rounded-full font-bold transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                    title="Send"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="bg-[#00a8ff] hover:bg-[#0088cc] active:scale-95 text-[#0b141a] w-11 h-11 rounded-full font-bold transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                    title="Hold to Record Voice Message"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            )}
          </div>
        )}

      </div>

      {/* Right Contact Info Sidebar Modal / Drawer */}
      {showRightSidebar && (
        <div 
          onClick={() => setShowRightSidebar(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm sm:w-80 h-full overflow-y-auto p-5 shadow-2xl flex flex-col border-l animate-slide-left ${
              isDark ? 'bg-[#111b21] border-[#222e35] text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base">{contact?.isGroup ? 'Group Info' : 'Contact Info'}</h3>
              <button 
                onClick={() => setShowRightSidebar(false)} 
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-500/20 mb-6">
              <div className="relative group">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-24 h-24 rounded-full object-cover shadow-xl mb-3 border-2 border-[#00a8ff]"
                />
                {contact.isGroup && isGroupCreator && (
                  <button
                    type="button"
                    onClick={() => groupAvatarInputRef.current?.click()}
                    className="absolute bottom-3 right-0 p-2 bg-[#00a8ff] text-white rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                    title="Change Group Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h4 className="font-bold text-lg flex items-center justify-center gap-1.5">
                {getContactDisplayName(contact)}
                {checkIsAdmin(contact) && <VerifiedBadge className="w-5 h-5 shrink-0 text-[#00a8ff]" />}
                {contact.isGroup && isGroupCreator && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupNameInput(contact.name);
                      setShowEditGroupNameModal(true);
                    }}
                    className="p-1 text-[#00a8ff] hover:bg-[#00a8ff]/10 rounded-lg transition-colors cursor-pointer"
                    title="Edit Group Name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </h4>

              {contact.isGroup ? (
                <div className="mt-2 w-full flex flex-col items-center gap-1">
                  {isGroupCreator ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#00a8ff]/15 text-[#00a8ff]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Group Creator (Admin)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400">
                      <Lock className="w-3.5 h-3.5" /> Only Creator Can Edit Settings
                    </span>
                  )}
                </div>
              ) : (
                <>
                  {customNicknames[contact.id] && (
                    <p className="text-xs text-[#00a8ff] font-medium mt-0.5">Original Name: {contact.name}</p>
                  )}
                  <p className="text-xs text-[#8596a0] mt-0.5">{contact.email || 'Encrypted User'}</p>
                  <p className="text-xs text-[#00a8ff] mt-2 font-medium">{contact.isOnline ? 'Online' : formatLastSeen(contact.lastSeen)}</p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRightSidebar(false);
                      setShowNicknameModal(true);
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-[#00a8ff]/10 hover:bg-[#00a8ff]/20 text-[#00a8ff] font-semibold text-xs border border-[#00a8ff]/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{customNicknames[contact.id] ? 'Edit Custom Name' : 'Set Custom Name'}</span>
                  </button>
                </>
              )}

              {/* Creator Management Buttons */}
              {contact.isGroup && isGroupCreator && (
                <div className="mt-4 w-full flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => groupAvatarInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-[#00a8ff]/10 hover:bg-[#00a8ff]/20 text-[#00a8ff] font-semibold text-xs border border-[#00a8ff]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Change Group Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => groupWallpaperInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold text-xs border border-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Image className="w-4 h-4" />
                    <span>Change Group Wallpaper</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewGroupNameInput(contact.name);
                      setShowEditGroupNameModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs border border-cyan-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Change Group Name</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteGroupConfirmModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Group for Everyone</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 text-xs">
              {contact.isGroup && (() => {
                const groupMembersList = getGroupMembersList(contact, allRegisteredUsers, contacts, user);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#8596a0] font-semibold uppercase tracking-wider text-[10px]">
                        Group Members ({groupMembersList.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddMembersModal(true)}
                        className="px-2.5 py-1 rounded-lg bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                        title="Add (+) Members to Group"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add (+)</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {groupMembersList.length === 0 ? (
                        <p className="text-xs text-[#8596a0] py-2">
                          No members added yet. Click <span className="font-bold text-[#00a8ff]">Add (+)</span> to add members!
                        </p>
                      ) : (
                        groupMembersList.map((m, idx) => (
                          <div key={idx} className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                            isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2.5 min-w-0">
                              {m.avatar ? (
                                <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#00a8ff]/30" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] flex items-center justify-center font-bold text-xs shrink-0">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-semibold text-xs truncate">{m.name}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              m.role === 'Creator'
                                ? 'bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/30'
                                : m.role === 'Admin'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400'
                            }`}>
                              {m.role}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <p className="text-[#8596a0] font-semibold mb-1 uppercase tracking-wider text-[10px]">About / Status</p>
                <p className="font-medium text-sm">{contact.status || 'Available'}</p>
              </div>

              <div className="pt-4 border-t border-gray-500/20">
                <p className="text-[#8596a0] font-semibold mb-2 uppercase tracking-wider text-[10px]">Shared Media & Files</p>
                <div className="grid grid-cols-3 gap-2">
                  {curMessages.filter(m => m.media?.type === 'image').slice(0, 6).map(m => (
                    <img
                      key={m.id}
                      src={m.media!.url}
                      alt="Shared"
                      className="w-full h-16 object-cover rounded-xl cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewMedia(m.media!.url)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-scale-in flex flex-col max-h-[85vh] ${
            isDark ? 'bg-[#111b21] border border-[#222e35] text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Forward className="w-5 h-5 text-[#00a8ff]" />
                <h3 className="font-bold text-base">Forward Message</h3>
              </div>
              <button 
                onClick={() => {
                  setForwardingMsg(null);
                  setForwardSearch('');
                  setForwardContactIds([]);
                }} 
                className="p-1 hover:bg-black/10 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Preview Box */}
            <div className={`p-3 rounded-2xl mb-3 text-xs shrink-0 border ${
              isDark ? 'bg-[#202c33] border-[#2a3942]/60 text-[#8696a0]' : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              <span className="font-bold block text-[#00a8ff] mb-0.5">Message Content</span>
              <p className="line-clamp-2 text-xs font-medium text-current">
                {renderTextWithLinks(forwardingMsg.text) || (forwardingMsg.media ? `[${forwardingMsg.media.type}] ${forwardingMsg.media.name || ''}` : 'Media Attachment')}
              </p>
            </div>

            {/* Contact Search Input */}
            <div className="mb-3 shrink-0">
              <input
                type="text"
                placeholder="Search contacts..."
                value={forwardSearch}
                onChange={e => setForwardSearch(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs focus:outline-none border ${
                  isDark
                    ? 'bg-[#202c33] border-[#2a3942] text-white placeholder-gray-400 focus:border-[#00a8ff]'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-sky-500'
                }`}
              />
            </div>

            {/* Contacts list */}
            <div className="overflow-y-auto space-y-2 mb-4 flex-1 pr-1 max-h-60">
              {contacts
                .filter(c => {
                  if (!forwardSearch.trim()) return true;
                  const q = forwardSearch.trim().toLowerCase();
                  return c.name.toLowerCase().includes(q) || (c.status && c.status.toLowerCase().includes(q));
                })
                .map(c => {
                  const isSelected = forwardContactIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setForwardContactIds(prev =>
                          prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                        );
                      }}
                      className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-[#00a8ff]/20 border-[#00a8ff]'
                          : (isDark ? 'bg-[#202c33] border-transparent hover:bg-[#2a3942]' : 'bg-gray-100 border-gray-200 hover:bg-gray-200')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={c.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-semibold block truncate">{getContactDisplayName(c)}</span>
                            {checkIsAdmin(c) && <VerifiedBadge className="w-3.5 h-3.5 shrink-0 text-[#00a8ff]" />}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00a8ff] shrink-0" />}
                    </div>
                  );
                })}
            </div>

            <button
              onClick={async () => {
                if (forwardContactIds.length === 0 || !forwardingMsg) return;
                await forwardMessage(forwardingMsg, forwardContactIds);
                showToast(`Forwarded message to ${forwardContactIds.length} chat${forwardContactIds.length > 1 ? 's' : ''}`);
                setForwardingMsg(null);
                setForwardContactIds([]);
                setForwardSearch('');
              }}
              disabled={forwardContactIds.length === 0}
              className="w-full bg-[#00a8ff] text-[#0b141a] font-bold py-3 rounded-xl text-xs hover:bg-[#0091ea] transition-colors disabled:opacity-50 shrink-0 shadow-lg cursor-pointer"
            >
              Send Forward ({forwardContactIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Full Screen WhatsApp Avatar Modal */}
      <WhatsAppProfileViewer
        isOpen={showFullAvatar}
        onClose={() => setShowFullAvatar(false)}
        name={contact?.name || 'Profile Photo'}
        avatarUrl={contact?.avatar || ''}
        subText={contact?.username ? `@${contact.username}` : contact?.status || 'Available'}
        onSendMessage={() => setShowFullAvatar(false)}
        onVoiceCall={() => alert(`Calling ${contact?.name}... 📞`)}
        onVideoCall={() => alert(`Starting video call with ${contact?.name}... 📹`)}
      />

      {/* Custom Contact Nickname Modal */}
      <NicknameModal 
        contact={contact}
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
      />

      {/* WhatsApp-Style Delete Message Bottom Sheet / Modal */}
      {deleteModalMsg && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => {
            setDeleteModalMsg(null);
            setDeleteConfirmType(null);
          }}
        >
          <div 
            className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all transform animate-slide-up ${
              isDark ? 'bg-[#1f2c34] text-[#e9edef] border border-[#2a3942]' : 'bg-white text-gray-900 border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-gray-500/40 rounded-full mx-auto my-2.5 sm:hidden" />

            {deleteConfirmType === null ? (
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-500/20">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-500" /> Delete message?
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setDeleteModalMsg(null)}
                    className="p-1 text-gray-400 hover:bg-gray-500/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 my-2">
                  {deleteModalMsg.senderId === user.id && !deleteModalMsg.deletedForEveryone && isMessageEditable(deleteModalMsg) && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetMsg = deleteModalMsg;
                        setDeleteModalMsg(null);
                        setEditingMsg(targetMsg);
                        setInputText(targetMsg.text);
                      }}
                      className={`w-full p-3.5 rounded-xl flex items-center justify-between font-medium text-sm transition-all cursor-pointer ${
                        isDark ? 'hover:bg-[#2a3942] bg-[#111b21]' : 'hover:bg-emerald-50 bg-emerald-50/50 text-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                          <Edit3 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-emerald-400 text-sm">Edit Message</div>
                          <div className="text-[11px] text-gray-400">Edit message within 2 minutes of sending</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  {deleteModalMsg.senderId === user.id && !deleteModalMsg.deletedForEveryone && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmType('everyone')}
                      className={`w-full p-3.5 rounded-xl flex items-center justify-between font-medium text-sm transition-all cursor-pointer ${
                        isDark ? 'hover:bg-[#2a3942] bg-[#111b21]' : 'hover:bg-rose-50 bg-rose-50/50 text-rose-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-rose-400 text-sm">Delete for Everyone</div>
                          <div className="text-[11px] text-gray-400">Remove message for all participants</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmType('me')}
                    className={`w-full p-3.5 rounded-xl flex items-center justify-between font-medium text-sm transition-all cursor-pointer ${
                      isDark ? 'hover:bg-[#2a3942] bg-[#111b21]' : 'hover:bg-amber-50 bg-amber-50/50 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-amber-400 text-sm">Delete for Me</div>
                        <div className="text-[11px] text-gray-400">Remove message from this device only</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalMsg(null)}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer mt-1 ${
                      isDark ? 'bg-[#2a3942] text-gray-300 hover:bg-[#324450]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <h3 className="font-bold text-base mb-1.5 text-[#e9edef]">
                  {deleteConfirmType === 'everyone' ? 'Delete for everyone?' : 'Delete for me?'}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-5">
                  {deleteConfirmType === 'everyone'
                    ? 'This message will be deleted for everyone in this chat. Other participants will see "This message was deleted".'
                    : 'This message will be permanently removed from your chat history on this device.'
                  }
                </p>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmType(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isDark ? 'bg-[#2a3942] text-gray-300 hover:bg-[#324450]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const targetId = deleteModalMsg.id;
                      setDeleteModalMsg(null);
                      setDeleteConfirmType(null);
                      if (deleteConfirmType === 'everyone') {
                        await deleteForEveryone(contact.id, targetId);
                        showToast('You deleted this message for everyone');
                      } else {
                        await deleteMessage(contact.id, targetId);
                        showToast('Message deleted for you');
                      }
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#233138] border border-[#00a8ff]/40 text-[#00a8ff] px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none">
          <CheckCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Unfriend Confirmation Modal */}
      {showUnfriendConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowUnfriendConfirmModal(false)}
        >
          <div 
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border transition-all animate-scale-up ${
              isDark ? 'bg-[#111b21] text-white border-[#202c33]' : 'bg-white text-slate-900 border-slate-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-lg mb-2">Remove this friend?</h3>
            <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
              Are you sure you want to remove <span className="font-bold text-current">{contact.name}</span> from your friends list? Chatting, calling, and media sharing will be disabled until you become friends again.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowUnfriendConfirmModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  isDark ? 'bg-[#202c33] hover:bg-[#2a3942] border-[#2a3942] text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowUnfriendConfirmModal(false);
                  await unfriendContact(contact.id);
                  showToast(`Unfriended ${contact.name}`);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Unfriend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Permission Blocked Help Modal */}
      {showMicBlockedModal && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowMicBlockedModal(false)}
        >
          <div 
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all animate-scale-up ${
              isDark ? 'bg-[#1f2c34] text-[#e9edef] border-[#2a3942]' : 'bg-white text-gray-900 border-gray-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-rose-500/20 text-rose-500 shrink-0">
                <MicOff className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Microphone Access Blocked</h3>
                <p className="text-xs text-gray-400">Permission required to send voice messages</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              Your browser is blocking microphone access. To record voice notes, please allow access in browser settings:
            </p>

            <ol className="text-xs space-y-2 mb-6 text-gray-300 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00a8ff] shrink-0">1.</span>
                <span>Click the lock icon 🔒 or settings icon in your address bar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00a8ff] shrink-0">2.</span>
                <span>Find <strong>Microphone</strong> permissions and change it to <strong>Allow</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00a8ff] shrink-0">3.</span>
                <span>Click <strong>Try Again</strong> below to start recording.</span>
              </li>
            </ol>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMicBlockedModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-[#2a3942] text-gray-300 hover:bg-[#324450]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMicBlockedModal(false);
                  handleStartRecording();
                }}
                className="px-5 py-2 rounded-xl text-xs bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Inputs for WhatsApp Media Selection */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* WhatsApp Multi-Media Selection & Preview Screen */}
      {pendingMediaList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col justify-between text-white animate-fade-in select-none">
          {/* Top Bar */}
          <div className="p-4 flex items-center justify-between border-b border-[#222e35] bg-[#111b21] z-10">
            <button
              type="button"
              onClick={() => {
                setPendingMediaList([]);
                setMediaCaption('');
              }}
              className="p-2 rounded-full hover:bg-white/10 text-gray-300 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="font-semibold text-sm text-[#e9edef] flex items-center gap-2">
              <span>Media Preview</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#202c33] text-xs font-mono text-[#00a8ff]">
                {activeMediaIndex + 1} of {pendingMediaList.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextList = pendingMediaList.filter((_, idx) => idx !== activeMediaIndex);
                setPendingMediaList(nextList);
                if (nextList.length > 0) {
                  setActiveMediaIndex(Math.min(activeMediaIndex, nextList.length - 1));
                }
              }}
              className="p-2 rounded-full hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
              title="Remove File"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Main Preview Screen */}
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-black/60">
            {pendingMediaList[activeMediaIndex] && (() => {
              const item = pendingMediaList[activeMediaIndex];
              if (item.type === 'image') {
                return (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl transition-all"
                  />
                );
              }
              if (item.type === 'video') {
                return (
                  <VideoMessagePlayer
                    src={item.url}
                    thumbnailUrl={item.thumbnailUrl}
                    duration={item.durationStr}
                    name={item.name}
                  />
                );
              }
              if (item.type === 'audio') {
                return (
                  <div className="p-8 rounded-2xl bg-[#111b21] border border-[#222e35] flex flex-col items-center gap-4 text-center max-w-sm w-full shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Music className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-base text-[#e9edef] truncate">{item.name}</p>
                      <p className="text-xs text-[#8596a0] font-mono">{item.sizeStr}</p>
                    </div>
                    <audio src={item.url} controls className="w-full mt-2" />
                  </div>
                );
              }
              return (
                <div className="p-8 rounded-2xl bg-[#111b21] border border-[#222e35] flex flex-col items-center gap-4 text-center max-w-sm w-full shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#e9edef] truncate">{item.name}</p>
                    <p className="text-xs text-[#8596a0] font-mono">{item.sizeStr}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Caption Input & Filmstrip Bar */}
          <div className="p-4 bg-[#111b21] border-t border-[#222e35] flex flex-col gap-3">
            {/* Caption Input */}
            <div className="flex items-center gap-3 bg-[#202c33] rounded-full px-4 py-2.5 border border-[#2a3942]">
              <Smile className="w-5 h-5 text-[#8596a0] shrink-0" />
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8596a0] focus:outline-none"
              />
              {(() => {
                const activeItem = pendingMediaList[activeMediaIndex];
                if (activeItem && (activeItem.type === 'image' || activeItem.type === 'video')) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingMediaList(prev => prev.map((item, i) => 
                          i === activeMediaIndex ? { ...item, isViewOnce: !item.isViewOnce } : item
                        ));
                        const nextState = !activeItem.isViewOnce;
                        showToast(nextState ? 'Photo/Video set to view once' : 'View once turned off');
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs transition-all cursor-pointer shrink-0 border-2 ${
                        activeItem.isViewOnce
                          ? 'bg-[#00a8ff] text-[#0b141a] border-[#00a8ff] shadow-md scale-105'
                          : 'border-[#8596a0] text-[#8596a0] hover:border-[#00a8ff] hover:text-[#00a8ff]'
                      }`}
                      title={activeItem.isViewOnce ? "View once is active (Recipient can view only 1 time)" : "Set to View Once"}
                    >
                      1
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            {/* Thumbnail Strip & Send Button */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {pendingMediaList.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeMediaIndex === idx ? 'border-[#00a8ff] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === 'video' ? (
                      <div className="w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-6 h-6 text-[#00a8ff]" />
                        )}
                        {item.durationStr && (
                          <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono font-bold text-white">
                            {item.durationStr}
                          </span>
                        )}
                      </div>
                    ) : item.type === 'audio' ? (
                      <div className="w-full h-full bg-amber-950/80 flex items-center justify-center">
                        <Music className="w-6 h-6 text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-indigo-950/80 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-indigo-400" />
                      </div>
                    )}
                  </button>
                ))}

                {/* Add More Button */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-[#2a3942] hover:border-[#00a8ff] flex items-center justify-center text-gray-400 hover:text-[#00a8ff] transition-colors shrink-0 cursor-pointer"
                  title="Add More Files"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Send Button */}
              <button
                type="button"
                disabled={isUploadingMedia}
                onClick={sendPendingMediaList}
                className="w-14 h-14 rounded-full bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] flex items-center justify-center shrink-0 shadow-xl active:scale-95 transition-all font-bold cursor-pointer disabled:opacity-50"
              >
                {isUploadingMedia ? (
                  <div className="w-6 h-6 border-2 border-[#0b141a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-6 h-6 ml-0.5 fill-current" />
                )}
              </button>
            </div>

            {/* Upload Progress Bar */}
            {isUploadingMedia && (
              <div className="w-full bg-[#202c33] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00a8ff] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Contact Picker Modal */}
      {showContactPickerModal && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowContactPickerModal(false)}
        >
          <div 
            className={`w-full max-w-md rounded-2xl shadow-2xl border transition-all animate-scale-up overflow-hidden ${
              isDark ? 'bg-[#111b21] text-[#e9edef] border-[#222e35]' : 'bg-white text-gray-900 border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#222e35] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <User className="w-5 h-5 text-blue-400" />
                <span>Share Contact</span>
              </div>
              <button
                type="button"
                onClick={() => setShowContactPickerModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-500/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-[#222e35]">
              <div className="flex items-center gap-2 bg-[#202c33] rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Search contact to share..."
                  className="w-full bg-transparent text-xs text-[#e9edef] focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Contact List */}
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {contacts
                .filter(c => c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()))
                .map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectContactToShare(c)}
                    className="w-full p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-[#e9edef]">{c.name}</p>
                        <p className="text-xs text-[#8596a0]">{c.status || 'Available'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#00a8ff]">Share</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Lightbox Image / Video Viewer */}
      {previewMedia && (() => {
        const mediaUrl = typeof previewMedia === 'string' ? previewMedia : previewMedia.url;
        const isVideo = typeof previewMedia === 'object' && previewMedia.type
          ? previewMedia.type === 'video'
          : (mediaUrl.startsWith('data:video') || mediaUrl.includes('video') || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov'));
        const fileName = (typeof previewMedia === 'object' && previewMedia.name) || (isVideo ? 'WhatsApp_Video.mp4' : 'WhatsApp_Image.jpg');

        return (
          <div
            onClick={() => {
              setPreviewMedia(null);
              setZoomScale(1);
              setImageRotation(0);
            }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex flex-col items-center justify-between p-4 animate-fade-in text-white select-none"
          >
            {/* Header Controls */}
            <div className="w-full max-w-4xl flex items-center justify-between p-2 z-10" onClick={e => e.stopPropagation()}>
              <div className="text-xs text-gray-300 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00a8ff]" />
                <span>{isVideo ? 'WhatsApp Video Viewer' : 'WhatsApp Media Viewer'}</span>
              </div>
              <div className="flex items-center gap-3">
                {!isVideo && (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Rotate"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  </>
                )}
                <a
                  href={mediaUrl}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-[#00a8ff] text-[#0b141a] font-bold hover:bg-[#0088cc] transition-colors cursor-pointer flex items-center justify-center"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewMedia(null);
                    setZoomScale(1);
                    setImageRotation(0);
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Canvas Image or Video */}
            <div className="flex-1 flex items-center justify-center p-2 w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              {isVideo ? (
                <video
                  src={mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain bg-black border border-white/10"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Media Preview"
                  style={{
                    transform: `scale(${zoomScale}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                  className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Live Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in select-none">
          {/* Header */}
          <div className="w-full max-w-lg flex items-center justify-between text-white z-10 px-2 pt-2">
            <div className="flex items-center gap-2 font-bold text-base">
              <Camera className="w-5 h-5 text-[#00a8ff]" />
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-3">
              {!capturedPhoto && cameraStream && (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Switch Camera (Front/Back)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close Camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Feed / Captured Photo Preview */}
          <div className="w-full max-w-lg flex-1 my-4 flex items-center justify-center relative overflow-hidden rounded-3xl bg-[#111b21] border border-white/10 shadow-2xl min-h-[300px]">
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured photo"
                className="w-full h-full object-contain rounded-3xl"
              />
            ) : cameraStream ? (
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover rounded-3xl ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : cameraError ? (
              <div className="p-6 text-center text-rose-400 space-y-4">
                <p className="text-sm font-medium">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    closeCameraModal();
                    photoInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 bg-[#00a8ff] text-[#0b141a] font-bold text-xs rounded-full shadow hover:bg-[#0088cc] transition-colors cursor-pointer"
                >
                  Pick Photo / Open Camera App
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <Camera className="w-8 h-8 text-[#00a8ff] animate-pulse" />
                <span>Starting camera...</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="w-full max-w-lg flex items-center justify-center pb-2 z-10">
            {capturedPhoto ? (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCapturedPhoto(null)}
                  className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCameraViewOnce(prev => !prev);
                    showToast(!cameraViewOnce ? 'View once photo enabled' : 'View once disabled');
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm transition-all cursor-pointer border-2 ${
                    cameraViewOnce
                      ? 'bg-[#00a8ff] text-[#0b141a] border-[#00a8ff] shadow-lg scale-105'
                      : 'border-white/40 text-white hover:border-[#00a8ff] hover:text-[#00a8ff]'
                  }`}
                  title={cameraViewOnce ? "View once is active" : "Set photo to View Once"}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={sendCapturedPhoto}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  <span>Send Photo</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : cameraStream ? (
              <button
                type="button"
                onClick={capturePhoto}
                className="w-18 h-18 rounded-full bg-white border-4 border-[#00a8ff] shadow-2xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                title="Take Photo"
              >
                <div className="w-14 h-14 rounded-full bg-[#00a8ff] hover:bg-[#0088cc] transition-colors flex items-center justify-center">
                  <Camera className="w-7 h-7 text-[#0b141a]" />
                </div>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* View Once Fullscreen Viewer Modal */}
      {viewOnceActiveMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in text-white select-none"
          onClick={() => setViewOnceActiveMedia(null)}
        >
          {/* Header */}
          <div className="w-full max-w-3xl mx-auto flex items-center justify-between py-2 px-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-[#00a8ff] bg-[#00a8ff]/20 text-[#00a8ff] flex items-center justify-center font-extrabold text-sm shadow">
                1
              </div>
              <div>
                <span className="font-bold text-base text-white block">
                  View Once {viewOnceActiveMedia.media.type === 'video' ? 'Video' : 'Photo'}
                </span>
                <span className="text-xs text-gray-400">Opened • This media will disappear when closed</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setViewOnceActiveMedia(null)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
              title="Close View Once"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Media Container */}
          <div className="flex-1 flex items-center justify-center p-2 max-w-3xl mx-auto w-full my-auto" onClick={e => e.stopPropagation()}>
            {viewOnceActiveMedia.media.type === 'video' ? (
              <video 
                src={viewOnceActiveMedia.media.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10" 
              />
            ) : (
              <img 
                src={viewOnceActiveMedia.media.url} 
                alt="View Once Photo" 
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10" 
              />
            )}
          </div>

          {/* Footer */}
          <div className="py-3 text-center flex flex-col items-center gap-2 max-w-md mx-auto w-full" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-gray-400">
              You can only view this {viewOnceActiveMedia.media.type === 'video' ? 'video' : 'photo'} once.
            </p>
            <button
              type="button"
              onClick={() => setViewOnceActiveMedia(null)}
              className="w-full py-2.5 rounded-full bg-[#00a8ff] text-[#0b141a] font-bold text-xs hover:bg-[#0088cc] transition-colors cursor-pointer shadow-lg"
            >
              Close View Once
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs for Group Avatar and Group Wallpaper */}
      <input
        type="file"
        ref={groupAvatarInputRef}
        onChange={handleGroupAvatarUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={groupWallpaperInputRef}
        onChange={handleGroupWallpaperUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Edit Group Name Modal */}
      {showEditGroupNameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveGroupName} 
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${
              isDark ? 'bg-[#1f2c34] border-[#2a3942] text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#00a8ff]" />
              <span>Change Group Name</span>
            </h3>
            <input
              type="text"
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              placeholder="Enter new group name..."
              className={`w-full p-3 rounded-xl text-sm font-medium border focus:outline-hidden focus:ring-2 focus:ring-[#00a8ff] mb-4 ${
                isDark ? 'bg-[#111b21] border-[#2a3942] text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditGroupNameModal(false)}
                className="px-4 py-2 rounded-xl font-medium text-xs opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newGroupNameInput.trim()}
                className="px-4 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow-md"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${
            isDark ? 'bg-[#1f2c34] border-[#2a3942] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-bold text-base">Delete Group for Everyone?</h3>
            </div>
            <p className="text-xs opacity-80 mb-5 leading-relaxed">
              Are you sure you want to delete <span className="font-bold">{contact?.name}</span>? This will permanently delete the group and remove it for all added members.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteGroupConfirmModal(false)}
                className="px-4 py-2 rounded-xl font-medium text-xs opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGroup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Per-Chat Wallpaper Modal */}
      {showWallpaperModal && contact && (
        <SetChatWallpaperModal
          isOpen={showWallpaperModal}
          onClose={() => setShowWallpaperModal(false)}
          contactName={getContactDisplayName(contact)}
          contactAvatar={contact.avatar}
          isDark={isDark}
          currentWallpaper={chatWallpaper}
          adminWallpapers={adminWallpapers}
          onApplyWallpaper={async (newWp) => {
            const updated = { ...perChatWallpapers, [contact.id]: newWp };
            setPerChatWallpapers(updated);
            try {
              localStorage.setItem('calcchat_per_chat_wallpapers', JSON.stringify(updated));
            } catch (e) {
              console.warn('Failed to save chat wallpaper:', e);
            }
            if (contact.isGroup) {
              try {
                await updateGroupDetails(contact.id, { wallpaper: newWp });
              } catch (e) {
                console.warn('Group wallpaper sync warning:', e);
              }
            }
            showToast(`Wallpaper set for ${getContactDisplayName(contact)}!`);
          }}
          onResetWallpaper={async () => {
            const updated = { ...perChatWallpapers };
            delete updated[contact.id];
            setPerChatWallpapers(updated);
            try {
              localStorage.setItem('calcchat_per_chat_wallpapers', JSON.stringify(updated));
            } catch (e) {
              console.warn('Failed to reset chat wallpaper:', e);
            }
            if (contact.isGroup) {
              try {
                await updateGroupDetails(contact.id, { wallpaper: '' });
              } catch (e) {
                console.warn('Group reset wallpaper warning:', e);
              }
            }
            showToast(`Wallpaper reset for ${getContactDisplayName(contact)}`);
          }}
        />
      )}

      {/* Select Members Modal for Group */}
      {showAddMembersModal && contact && (
        <SelectMembersModal
          groupId={contact.id}
          groupName={getContactDisplayName(contact)}
          existingMembers={contact.groupMembers || contact.members || []}
          onClose={() => setShowAddMembersModal(false)}
        />
      )}

      {/* Status Unavailable Toast */}
      {statusToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#111b21] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Loading Status Indicator Overlay */}
      {isLoadingStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-[#111b21] text-white p-4 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl">
            <Loader2 className="w-6 h-6 text-[#00a8ff] animate-spin" />
            <span className="text-sm font-medium">Opening status...</span>
          </div>
        </div>
      )}

      {/* Reused Fullscreen Status Viewer */}
      {statusViewerGroups && statusViewerGroups.length > 0 && (
        <StatusViewer
          statusGroups={statusViewerGroups}
          initialGroupIndex={statusViewerGroupIdx}
          initialStatusIndex={statusViewerStatusIdx}
          currentUserId={authUser?.uid || 'me'}
          currentUserName={user.name || authUser?.displayName || 'Me'}
          currentUserAvatar={user.avatar || authUser?.photoURL || ''}
          onClose={() => setStatusViewerGroups(null)}
          onLikeStatus={likeStatusUpdate}
          onMarkSeen={markStatusAsSeen}
          onSendReply={replyToStatus}
          onSendReaction={reactToStatus}
          onDeleteStatus={deleteStatusUpdate}
          getSeenRecords={getSeenRecords}
          getLikeRecords={getLikeRecords}
          isDark={isDark}
        />
      )}

    </div>
  );
};

