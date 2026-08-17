import React, { useState, useEffect, useRef, Component, ErrorInfo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Send, Sparkles, Plus, Trash2, Copy, Share2, RefreshCw, 
  Edit3, MoreVertical, Check, MessageSquare, History, Bot, CornerDownLeft, X,
  Terminal, ShieldCheck, Heart, User, CheckCheck, Lightbulb
} from 'lucide-react';
import { PINK_AI_AVATAR_SVG } from '../assets/aiAvatarData';
import { 
  AIMessage, AIConversation, streamAIChatResponse, 
  CREATOR_RESPONSE, isCreatorQuestion 
} from '../lib/geminiService';

interface AIChatWindowProps {
  onClose: () => void;
  onClearAIChatFromList?: () => void;
}

const STORAGE_KEY_AI_CONVERSATIONS = 'calcchat_ai_conversations_v2';
const STORAGE_KEY_ACTIVE_AI_ID = 'calcchat_active_ai_id_v2';

// Format inline text for **bold** and `inline code`
function formatInlineText(str: string): React.ReactNode[] {
  if (!str) return [];
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b_${match.index}_${lastIdx}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c_${match.index}_${lastIdx}`} className="bg-[#202c33] text-[#ff77bc] px-1.5 py-0.5 rounded text-[11px] font-mono border border-pink-500/20">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts;
}

// Formats non-code block lines (headings, bullets, numbered items, paragraphs)
const FormattedTextLines: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm text-[#ff77bc] mt-2 mb-1">
              {formatInlineText(trimmed.replace('### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-black text-sm text-white mt-2 mb-1">
              {formatInlineText(trimmed.replace(/^#+\s*/, ''))}
            </h3>
          );
        }

        // Bullet list item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="text-[#ff2e93] font-bold text-xs mt-0.5">•</span>
              <div className="flex-1">{formatInlineText(trimmed.substring(2))}</div>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="text-[#ff77bc] font-bold text-xs mt-0.5">{numMatch[1]}.</span>
              <div className="flex-1">{formatInlineText(numMatch[2])}</div>
            </div>
          );
        }

        // Regular line
        return (
          <div key={idx} className="leading-relaxed my-0.5">
            {formatInlineText(line)}
          </div>
        );
      })}
    </>
  );
};

// Main FormattedText renderer with full code block support
const FormattedText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  try {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textPart = content.substring(lastIndex, match.index);
        parts.push(<FormattedTextLines key={`txt_${lastIndex}`} text={textPart} />);
      }
      const lang = match[1] || 'Code';
      const codeContent = match[2] || '';
      parts.push(
        <div key={`code_${match.index}`} className="my-2 rounded-xl bg-[#0b141a] border border-[#2a3942] overflow-hidden text-xs">
          <div className="bg-[#1f2c34] px-3 py-1.5 border-b border-[#2a3942] flex items-center justify-between text-[11px] text-gray-400">
            <span className="font-mono flex items-center gap-1 font-bold text-[#ff77bc]"><Terminal className="w-3.5 h-3.5 text-[#ff2e93]" /> {lang}</span>
            <button
              type="button"
              onClick={() => {
                try {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(codeContent);
                  }
                } catch (e) {
                  // ignore
                }
              }}
              className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="p-3 overflow-x-auto text-pink-200 font-mono text-[11px] whitespace-pre-wrap break-words leading-relaxed">
            {codeContent}
          </pre>
        </div>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(<FormattedTextLines key={`txt_${lastIndex}`} text={content.substring(lastIndex)} />);
    }

    return <div className="text-xs sm:text-sm leading-relaxed select-text">{parts}</div>;
  } catch (err) {
    return <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed select-text">{content}</div>;
  }
};

const AIChatWindowInner: React.FC<AIChatWindowProps> = ({ onClose, onClearAIChatFromList }) => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [toastText, setToastText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial Load of Conversations with robust sanitation
  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem(STORAGE_KEY_AI_CONVERSATIONS);
      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_AI_ID);

      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validConvs: AIConversation[] = parsed
            .filter((c: any) => c && typeof c === 'object')
            .map((c: any) => ({
              id: typeof c.id === 'string' ? c.id : ('ai_conv_' + Date.now()),
              title: typeof c.title === 'string' ? c.title : 'New Conversation',
              messages: Array.isArray(c.messages)
                ? c.messages.filter((m: any) => m && typeof m === 'object' && typeof m.sender === 'string').map((m: any) => ({
                    id: typeof m.id === 'string' ? m.id : ('msg_' + Date.now() + '_' + Math.random()),
                    sender: m.sender === 'user' ? 'user' : 'ai',
                    text: typeof m.text === 'string' ? m.text : '',
                    timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isStreaming: Boolean(m.isStreaming),
                    error: Boolean(m.error)
                  }))
                : [],
              createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
              updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : new Date().toISOString()
            }));

          if (validConvs.length > 0) {
            setConversations(validConvs);
            const active = validConvs.find(c => c.id === savedActiveId) || validConvs[0];
            setActiveConvId(active.id);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load AI conversations:', e);
      localStorage.removeItem(STORAGE_KEY_AI_CONVERSATIONS);
    }

    // Default Fresh Conversation
    createNewConversation();
  }, []);

  // Save Conversations on Change
  useEffect(() => {
    const hasUserMsg = Array.isArray(conversations) && conversations.some(c => Array.isArray(c.messages) && c.messages.some(m => m && m.sender === 'user'));
    if (conversations.length > 0 && hasUserMsg) {
      localStorage.setItem(STORAGE_KEY_AI_CONVERSATIONS, JSON.stringify(conversations));
    } else {
      localStorage.removeItem(STORAGE_KEY_AI_CONVERSATIONS);
    }
    window.dispatchEvent(new Event('calcchat_ai_updated'));
  }, [conversations]);

  useEffect(() => {
    if (activeConvId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_AI_ID, activeConvId);
    }
  }, [activeConvId]);

  // Current active conversation
  const currentConv = (Array.isArray(conversations) && conversations.length > 0)
    ? (conversations.find(c => c && c.id === activeConvId) || conversations[0])
    : null;

  const messages = (currentConv && Array.isArray(currentConv.messages))
    ? currentConv.messages.filter((m: any) => m && typeof m === 'object' && typeof m.sender === 'string')
    : [];

  // Auto-scroll on new message / stream
  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isGenerating]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 2500);
  };

  // Create a brand new conversation
  const createNewConversation = () => {
    const newId = 'ai_conv_' + Date.now();
    const welcomeMsg: AIMessage = {
      id: 'welcome_' + Date.now(),
      sender: 'ai',
      text: `Hello! 👋 I'm your **Universal CalcChat AI Assistant**!

I have limitless intelligence to answer **any question or task from around the world**:
- 🌍 **Duniya Ka Koi Bhi Sawaal**: World history, geography, space, science, GK, culture & current affairs
- 📚 **Studies & Homework**: Step-by-step Math (Algebra, Calculus), Physics, Chemistry, Biology & Exams
- 💻 **Coding & Technology**: JavaScript, Python, React, Java, C++, HTML/CSS, algorithms & bug fixes
- 🌐 **All-Language Translations**: Translate fluently to/from Hindi, English, Hinglish, Marathi, Spanish, etc.
- ✍️ **Creative & Writing**: Essays, stories, professional emails, letters & resumes
- 🔒 **CalcChat App Guides**: Passcode change, group creation, wallpapers, chat lock & privacy settings

Ask me anything in Hindi, English, or any language below! 😊`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newConv: AIConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [welcomeMsg],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setConversations(prev => [newConv, ...(Array.isArray(prev) ? prev : [])]);
    setActiveConvId(newId);
    setIsGenerating(false);
    setShowOptionsMenu(false);
  };

  // Clear current active conversation
  const handleClearChat = () => {
    localStorage.removeItem(STORAGE_KEY_AI_CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_AI_ID);

    const newId = 'ai_conv_' + Date.now();
    const freshConv: AIConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setConversations([freshConv]);
    setActiveConvId(newId);
    setShowOptionsMenu(false);

    window.dispatchEvent(new Event('calcchat_ai_updated'));
    if (onClearAIChatFromList) {
      onClearAIChatFromList();
    }
    showToast('AI Chat cleared successfully');
  };

  // Send prompt
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputText).trim();
    if (!promptToSend || isGenerating || !currentConv) return;

    setInputText('');
    setEditingMsgId(null);

    const userMsgId = 'usr_' + Date.now();
    const userMsg: AIMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Auto update conversation title on first real question
    let updatedTitle = currentConv.title || 'New Conversation';
    if ((currentConv.messages || []).length <= 1 || currentConv.title === 'New Conversation') {
      updatedTitle = promptToSend.slice(0, 30) + (promptToSend.length > 30 ? '...' : '');
    }

    const aiMsgId = 'ai_' + (Date.now() + 1);
    const initialAiMsg: AIMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };

    // Update state with user message + placeholder AI message
    const updatedMessages = [...(currentConv.messages || []), userMsg, initialAiMsg];
    
    setConversations(prev => (Array.isArray(prev) ? prev : []).map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          title: updatedTitle,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    setIsGenerating(true);

    try {
      // Stream AI response
      await streamAIChatResponse(
        currentConv.messages || [],
        promptToSend,
        (chunk, fullTextSoFar) => {
          setConversations(prev => (Array.isArray(prev) ? prev : []).map(c => {
            if (c.id === activeConvId) {
              const msgs = (c.messages || []).map(m => {
                if (m.id === aiMsgId) {
                  return {
                    ...m,
                    text: fullTextSoFar,
                    isStreaming: true
                  };
                }
                return m;
              });
              return { ...c, messages: msgs };
            }
            return c;
          }));
        }
      );
    } catch (error) {
      console.error('Error generating AI response:', error);
      setConversations(prev => (Array.isArray(prev) ? prev : []).map(c => {
        if (c.id === activeConvId) {
          const msgs = (c.messages || []).map(m => {
            if (m.id === aiMsgId) {
              return {
                ...m,
                text: 'Sorry, I encountered an issue generating a response. Please try again.',
                error: true
              };
            }
            return m;
          });
          return { ...c, messages: msgs };
        }
        return c;
      }));
    } finally {
      // Mark streaming completed
      setConversations(prev => (Array.isArray(prev) ? prev : []).map(c => {
        if (c.id === activeConvId) {
          const msgs = (c.messages || []).map(m => {
            if (m.id === aiMsgId) {
              return { ...m, isStreaming: false };
            }
            return m;
          });
          return { ...c, messages: msgs };
        }
        return c;
      }));
      setIsGenerating(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = (aiMsgIndex: number) => {
    if (isGenerating || aiMsgIndex <= 0) return;
    const prevUserMsg = messages[aiMsgIndex - 1];
    if (prevUserMsg && prevUserMsg.sender === 'user') {
      const truncatedMessages = messages.slice(0, aiMsgIndex);
      setConversations(prev => (Array.isArray(prev) ? prev : []).map(c => {
        if (c.id === activeConvId) {
          return { ...c, messages: truncatedMessages };
        }
        return c;
      }));
      handleSendMessage(prevUserMsg.text);
    }
  };

  // Copy Message Text
  const handleCopy = (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedMsgId(id);
      showToast('Copied to clipboard');
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (err) {
      showToast('Copied text');
    }
  };

  // Share Message
  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'CalcChat AI Answer',
        text: text
      }).catch(() => {});
    } else {
      handleCopy(text, 'share_tmp');
    }
  };

  // Delete Individual Conversation
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = conversations.filter(c => c.id !== id);
    if (remaining.length === 0) {
      createNewConversation();
    } else {
      setConversations(remaining);
      if (activeConvId === id) {
        setActiveConvId(remaining[0].id);
      }
    }
    showToast('Conversation deleted');
  };

  // Quick prompt suggestions
  const QUICK_PROMPTS = [
    '🌍 Duniya ka koi bhi sawaal pucho',
    '📚 Solve Math/Physics step-by-step',
    '🌐 Translate to Hindi/English/Marathi',
    '💻 Write code in React / Python / JS',
    '🔒 How to change passcode',
    '❓ Who created you?'
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0b141a] text-gray-100 select-none relative overflow-hidden font-sans">
      
      {/* Pink AI Header */}
      <div className="bg-gradient-to-r from-[#2a0e21] via-[#20101b] to-[#121b22] border-b border-[#ff2e93]/30 px-3 py-2.5 flex items-center justify-between z-30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 active:scale-95 rounded-full text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Cute Pink Bot Avatar */}
          <div className="relative cursor-pointer group" onClick={() => setShowHistoryModal(true)}>
            <div className="w-10 h-10 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#ff2e93] via-[#ff62b0] to-[#f43f5e] shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <img 
                src={PINK_AI_AVATAR_SVG} 
                alt="AI Bot" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0b141a] rounded-full animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-white tracking-wide">CalcChat AI</h1>
              <span className="bg-gradient-to-r from-[#ff2e93] to-[#ff62b0] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-[#ff77bc] font-medium flex items-center gap-1">
              {isGenerating ? (
                <>
                  <Sparkles className="w-3 h-3 animate-spin text-[#ff2e93]" />
                  <span>AI is typing...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Online • Always Ready</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={createNewConversation}
            className="p-2 hover:bg-[#ff2e93]/20 active:scale-95 text-[#ff77bc] hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer border border-[#ff2e93]/30"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="p-2 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Conversation History"
          >
            <History className="w-4.5 h-4.5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Options"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-11 w-48 bg-[#202c33] border border-[#ff2e93]/30 rounded-2xl shadow-2xl py-2 z-50 animate-scale-in text-xs">
                <button
                  type="button"
                  onClick={createNewConversation}
                  className="w-full px-4 py-2.5 text-left text-gray-200 hover:bg-[#ff2e93]/20 hover:text-white flex items-center gap-2.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#ff2e93]" />
                  <span>New Conversation</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-gray-200 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer"
                >
                  <History className="w-4 h-4 text-[#ff77bc]" />
                  <span>Chat History</span>
                </button>
                <div className="my-1 border-t border-gray-700/50"></div>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="w-full px-4 py-2.5 text-left text-rose-400 hover:bg-rose-500/20 flex items-center gap-2.5 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Conversation Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 no-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d0b1a]/40 via-[#0b141a] to-[#0b141a]">
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-4">
            <div className="w-16 h-16 rounded-3xl p-1 bg-gradient-to-tr from-[#ff2e93] to-[#f43f5e] shadow-xl shadow-pink-500/30">
              <img src={PINK_AI_AVATAR_SVG} alt="AI Avatar" className="w-full h-full object-cover rounded-2xl" />
            </div>
            <h2 className="text-lg font-bold text-white">Ask Anything in the World!</h2>
            <p className="text-xs text-gray-400 max-w-xs">Duniya ka koi bhi sawaal pucho — Studies, Math, Coding, Science, Translations, GK ya CalcChat settings!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (!msg) return null;
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-slide-up group`}
            >
              <div className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[82%]`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 mt-1 border border-[#ff2e93]/40 shadow-md">
                    <img src={PINK_AI_AVATAR_SVG} alt="AI Avatar" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 text-sm shadow-md transition-all relative ${
                    isUser
                      ? 'bg-gradient-to-r from-[#e91e63] to-[#ff2e93] text-white rounded-tr-none'
                      : 'bg-[#182229] border border-[#ff2e93]/20 text-gray-100 rounded-tl-none'
                  }`}
                >
                  {/* Streaming indicator */}
                  {msg.isStreaming && !msg.text && (
                    <div className="flex items-center gap-1.5 py-1 px-1">
                      <span className="w-2 h-2 rounded-full bg-[#ff2e93] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#ff62b0] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#ff77bc] animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-xs text-[#ff77bc] font-medium ml-1">AI is thinking...</span>
                    </div>
                  )}

                  {/* Message Content with Formatted Text */}
                  <div className="text-xs sm:text-sm leading-relaxed overflow-x-auto select-text">
                    <FormattedText content={msg.text || ''} />
                  </div>

                  {/* Message Timestamp & Status */}
                  <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isUser ? 'text-pink-100/80' : 'text-gray-400'}`}>
                    <span>{msg.timestamp || ''}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-pink-200" />}
                  </div>

                  {/* Action Toolbar on Hover/Focus */}
                  {!msg.isStreaming && msg.text && (
                    <div className={`mt-2 pt-1.5 border-t ${isUser ? 'border-pink-400/30' : 'border-gray-700/40'} flex items-center justify-end gap-2 text-xs`}>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="p-1 hover:bg-black/20 rounded-md transition-colors text-gray-300 hover:text-white cursor-pointer"
                        title="Copy message"
                      >
                        {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare(msg.text)}
                        className="p-1 hover:bg-black/20 rounded-md transition-colors text-gray-300 hover:text-white cursor-pointer"
                        title="Share message"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleRegenerate(index)}
                          className="p-1 hover:bg-black/20 rounded-md transition-colors text-gray-300 hover:text-[#ff77bc] cursor-pointer"
                          title="Regenerate response"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputText(msg.text);
                            inputRef.current?.focus();
                          }}
                          className="p-1 hover:bg-black/20 rounded-md transition-colors text-gray-300 hover:text-white cursor-pointer"
                          title="Edit prompt"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      {!isGenerating && (
        <div className="px-3 py-1.5 bg-[#0b141a] border-t border-gray-800/60 overflow-x-auto no-scrollbar flex items-center gap-2 text-[11px]">
          <span className="text-gray-400 shrink-0 font-medium flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-[#ff2e93]" /> Quick Questions:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 bg-[#1f2c34] hover:bg-[#ff2e93]/20 border border-[#ff2e93]/30 hover:border-[#ff2e93] text-gray-200 hover:text-white px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-[#111b21] border-t border-[#ff2e93]/20 flex items-center gap-2 z-30">
        <div className="flex-1 relative bg-[#202c33] rounded-2xl border border-[#ff2e93]/30 focus-within:border-[#ff2e93] transition-colors flex items-center px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask any question in the world (Duniya ka koi bhi sawal)..."
            className="w-full bg-transparent text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none pr-2"
          />
        </div>

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isGenerating}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ff2e93] hover:from-[#ff2e93] hover:to-[#ff62b0] active:scale-95 disabled:opacity-40 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 transition-all cursor-pointer shrink-0"
          title="Send"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Chat History Drawer / Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1f2c34] border border-[#ff2e93]/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700/60 mb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#ff2e93]" />
                <span>AI Chat History</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {(conversations || []).map(conv => {
                if (!conv) return null;
                const isActive = conv.id === activeConvId;
                const msgCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowHistoryModal(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-[#ff2e93]/20 border-[#ff2e93] text-white'
                        : 'bg-[#111b21] border-gray-700/50 hover:bg-[#2a3942] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ff2e93]' : 'text-gray-400'}`} />
                      <div className="truncate text-xs font-medium">
                        <p className="truncate text-white">{conv.title || 'New Conversation'}</p>
                        <p className="text-[10px] text-gray-400">
                          {conv?.updatedAt && !isNaN(new Date(conv.updatedAt).getTime())
                            ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : 'Today'} • {msgCount} messages
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-black/20 cursor-pointer transition-colors"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-700/60 mt-3 flex justify-end">
              <button
                type="button"
                onClick={createNewConversation}
                className="px-4 py-2 rounded-xl bg-[#ff2e93] hover:bg-[#ff1e85] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastText && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#202c33] border border-[#ff2e93]/50 text-[#ff77bc] px-4 py-2 rounded-full text-xs font-medium shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

    </div>
  );
};

class AIChatWindowBoundary extends Component<AIChatWindowProps, { hasError: boolean }> {
  constructor(props: AIChatWindowProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AIChatWindow Boundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AI_CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_AI_ID);
      window.dispatchEvent(new Event('calcchat_ai_updated'));
    } catch (e) {
      // ignore
    }
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col h-full w-full bg-[#0b141a] text-gray-100 items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#ff2e93] to-[#f43f5e] p-0.5 mb-4 shadow-xl shadow-pink-500/30 flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">CalcChat AI Assistant</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-5 leading-relaxed">
            There was a problem starting the AI chat session. Click below to reset and start a fresh chat.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e91e63] to-[#ff2e93] text-white text-xs font-bold shadow-md shadow-pink-500/20 active:scale-95 transition-transform cursor-pointer"
            >
              Reset & Open AI Chat
            </button>
            <button
              type="button"
              onClick={this.props.onClose}
              className="px-4 py-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-gray-300 text-xs font-semibold active:scale-95 transition-transform cursor-pointer border border-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return <AIChatWindowInner {...this.props} />;
  }
}

export const AIChatWindow: React.FC<AIChatWindowProps> = (props) => {
  return <AIChatWindowBoundary {...props} />;
};
