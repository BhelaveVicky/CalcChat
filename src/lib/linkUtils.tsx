import React from 'react';
import { MentionData } from '../types';

/**
 * Combined regex to match URLs or @username mentions
 */
const COMBINED_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|co|in|edu|gov|dev|app|me|tech|info|xyz|ai|ca|uk|de|fr|jp|site|live|online|store)(?:\/[^\s<]*)?|@([a-zA-Z0-9_.-]+))/gi;

export interface RenderTextOptions {
  mentions?: MentionData[];
  currentUsername?: string;
  currentUserId?: string;
  onMentionClick?: (userId?: string, username?: string) => void;
}

/**
 * Auto-detects URLs and @username mentions in text and renders them appropriately.
 */
export function renderTextWithLinksAndMentions(
  text: string | undefined | null,
  options?: RenderTextOptions
): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  COMBINED_REGEX.lastIndex = 0;

  const currentUsernameLower = (options?.currentUsername || '').toLowerCase();
  const currentUserId = options?.currentUserId;

  while ((match = COMBINED_REGEX.exec(text)) !== null) {
    const matchIndex = match.index;
    const fullMatch = match[0];
    const usernameMatch = match[2];

    // Add preceding plain text
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    // Check if this match is an @username mention
    if (usernameMatch) {
      const cleanUsername = usernameMatch.toLowerCase();
      
      // Look up mention in metadata
      const foundMention = options?.mentions?.find(
        (m) => m.username.toLowerCase() === cleanUsername
      );

      const targetUserId = foundMention?.userId;
      const isSelfMention = (currentUsernameLower && cleanUsername === currentUsernameLower) || (currentUserId && targetUserId === currentUserId);

      parts.push(
        <span
          key={`mention-${matchIndex}-${cleanUsername}`}
          onClick={(e) => {
            e.stopPropagation();
            if (options?.onMentionClick) {
              options.onMentionClick(targetUserId, usernameMatch);
            } else if (targetUserId) {
              window.dispatchEvent(new CustomEvent('openUserProfile', { detail: { userId: targetUserId, username: usernameMatch } }));
            } else {
              window.dispatchEvent(new CustomEvent('openUserProfileByUsername', { detail: { username: usernameMatch } }));
            }
          }}
          className={
            isSelfMention
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold px-1.5 py-0.5 rounded cursor-pointer hover:bg-sky-500/30 transition-colors inline-flex items-center gap-0.5 my-0.5 shadow-xs"
              : "text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer inline transition-colors"
          }
          title={isSelfMention ? `You were mentioned (@${usernameMatch})` : `Click to view @${usernameMatch}'s profile`}
        >
          @{usernameMatch}
        </span>
      );

      lastIndex = matchIndex + fullMatch.length;
      continue;
    }

    // Otherwise, handle URL matching
    let urlMatch = fullMatch;
    let trailingPunctuation = '';
    while (/[.,!?;:)]$/.test(urlMatch)) {
      if (urlMatch.endsWith(')')) {
        const openParens = (urlMatch.match(/\(/g) || []).length;
        const closeParens = (urlMatch.match(/\)/g) || []).length;
        if (openParens >= closeParens) {
          break;
        }
      }
      trailingPunctuation = urlMatch.slice(-1) + trailingPunctuation;
      urlMatch = urlMatch.slice(0, -1);
    }

    if (!urlMatch) {
      lastIndex = matchIndex + fullMatch.length;
      continue;
    }

    let href = urlMatch;
    if (urlMatch.toLowerCase().startsWith('www.')) {
      href = `https://${urlMatch}`;
    } else if (!/^https?:\/\//i.test(urlMatch)) {
      href = `https://${urlMatch}`;
    }

    parts.push(
      <a
        key={`link-${matchIndex}-${urlMatch}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#ff2e93] hover:text-[#ff1e85] underline font-medium break-all transition-colors duration-150 inline cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          const joinMatch = href.match(/\/join\/([^/\s?#]+)/i);
          if (joinMatch && joinMatch[1]) {
            e.preventDefault();
            let rawId = joinMatch[1];
            if (rawId.startsWith('g_')) {
              rawId = rawId.replace(/^g_/, '');
            }
            const groupId = rawId.startsWith('group_') ? rawId : (rawId.includes('_') ? rawId : `group_${rawId}`);
            window.dispatchEvent(new CustomEvent('openGroupInvite', { detail: { groupId } }));
          }
        }}
      >
        {urlMatch}
      </a>
    );

    if (trailingPunctuation) {
      parts.push(trailingPunctuation);
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

export function renderTextWithLinks(
  text: string | undefined | null,
  options?: RenderTextOptions
): React.ReactNode {
  return renderTextWithLinksAndMentions(text, options);
}
