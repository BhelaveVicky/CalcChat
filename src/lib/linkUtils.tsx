import React from 'react';

/**
 * Regex to match URLs starting with http://, https://, www., or standard domains
 */
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|co|in|edu|gov|dev|app|me|tech|info|xyz|ai|ca|uk|de|fr|jp|site|live|online|store)(?:\/[^\s<]*)?)/gi;

/**
 * Parses markdown inline styles like **bold**, *italic*, ~strikethrough~, _italic_
 */
function parseInlineMarkdown(str: string, keyPrefix: string): React.ReactNode[] {
  if (!str) return [];

  // Match **bold**, *italic*, ~strikethrough~, or _italic_
  const mdRegex = /(\*\*(.*?)\*\*|\*(.*?)\*|~(.*?)~|_(.*?)_)/g;
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = mdRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(str.substring(lastIdx, match.index));
    }

    const full = match[0];
    const key = `${keyPrefix}-md-${match.index}`;

    if (full.startsWith('**') && full.endsWith('**')) {
      const content = match[2];
      nodes.push(<strong key={key} className="font-extrabold">{content}</strong>);
    } else if (full.startsWith('*') && full.endsWith('*')) {
      const content = match[3];
      nodes.push(<em key={key} className="italic">{content}</em>);
    } else if (full.startsWith('~') && full.endsWith('~')) {
      const content = match[4];
      nodes.push(<del key={key} className="line-through">{content}</del>);
    } else if (full.startsWith('_') && full.endsWith('_')) {
      const content = match[5];
      nodes.push(<em key={key} className="italic">{content}</em>);
    } else {
      nodes.push(full);
    }

    lastIdx = match.index + full.length;
  }

  if (lastIdx < str.length) {
    nodes.push(str.substring(lastIdx));
  }

  return nodes;
}

/**
 * Auto-detects URLs in text and renders them as clickable hyperlinks,
 * while also rendering markdown inline styles like **bold** and *italic*.
 */
export function renderTextWithLinks(text: string | undefined | null): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const matchIndex = match.index;
    let fullMatch = match[0];

    // Trim trailing punctuation
    let trailingPunctuation = '';
    while (/[.,!?;:)]$/.test(fullMatch)) {
      if (fullMatch.endsWith(')')) {
        const openParens = (fullMatch.match(/\(/g) || []).length;
        const closeParens = (fullMatch.match(/\)/g) || []).length;
        if (openParens >= closeParens) {
          break;
        }
      }
      trailingPunctuation = fullMatch.slice(-1) + trailingPunctuation;
      fullMatch = fullMatch.slice(0, -1);
    }

    if (!fullMatch) continue;

    // Add preceding plain text with markdown
    if (matchIndex > lastIndex) {
      const plainSegment = text.substring(lastIndex, matchIndex);
      parts.push(...parseInlineMarkdown(plainSegment, `seg-${matchIndex}`));
    }

    // Format destination href
    let href = fullMatch;
    if (fullMatch.toLowerCase().startsWith('www.')) {
      href = `https://${fullMatch}`;
    } else if (!/^https?:\/\//i.test(fullMatch)) {
      href = `https://${fullMatch}`;
    }

    parts.push(
      <a
        key={`link-${matchIndex}-${fullMatch}`}
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
        {fullMatch}
      </a>
    );

    if (trailingPunctuation) {
      parts.push(...parseInlineMarkdown(trailingPunctuation, `trail-${matchIndex}`));
    }

    lastIndex = matchIndex + match[0].length;
  }

  // Add remaining text with markdown
  if (lastIndex < text.length) {
    const remainingSegment = text.substring(lastIndex);
    parts.push(...parseInlineMarkdown(remainingSegment, `rem-${lastIndex}`));
  }

  return <>{parts}</>;
}

