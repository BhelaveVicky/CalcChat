import React from 'react';

/**
 * Regex to match URLs starting with http://, https://, www., or standard domains
 */
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|co|in|edu|gov|dev|app|me|tech|info|xyz|ai|ca|uk|de|fr|jp|site|live|online|store)(?:\/[^\s<]*)?)/gi;

/**
 * Auto-detects URLs in text and renders them as blue, underlined, clickable hyperlinks
 * that open in a new browser tab.
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

    // Trim trailing punctuation that shouldn't be part of the URL (e.g. "https://site.com.", "(https://site.com)")
    let trailingPunctuation = '';
    while (/[.,!?;:)]$/.test(fullMatch)) {
      if (fullMatch.endsWith(')')) {
        const openParens = (fullMatch.match(/\(/g) || []).length;
        const closeParens = (fullMatch.match(/\)/g) || []).length;
        if (openParens >= closeParens) {
          break; // Keep ')' if balanced within URL (e.g. Wikipedia links)
        }
      }
      trailingPunctuation = fullMatch.slice(-1) + trailingPunctuation;
      fullMatch = fullMatch.slice(0, -1);
    }

    if (!fullMatch) continue;

    // Add preceding plain text
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
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
          e.stopPropagation(); // Stop propagation so message selection or bubble actions aren't triggered
          
          // Check if link is a group invite link containing /join/
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
      parts.push(trailingPunctuation);
    }

    lastIndex = matchIndex + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}
