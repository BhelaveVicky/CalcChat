import React from 'react';

export const ADMIN_EMAILS = [
  'vickybhelave25@navgurukul.org',
  'bhelavevicky66@gamil.com',
  'bhelavevicky66@gmail.com',
];

export function checkIsAdmin(userData?: any): boolean {
  if (!userData) return false;

  let email = '';
  let username = '';
  let name = '';

  if (typeof userData === 'string') {
    email = userData.toLowerCase().trim();
  } else if (typeof userData === 'object') {
    if (userData.isVerified === false || userData.verified === false) {
      return false;
    }
    if (userData.isVerified === true || userData.verified === true || userData.isVerifiedAdmin === true) {
      return true;
    }
    email = (userData.email || '').toLowerCase().trim();
    username = (userData.username || '').toLowerCase().trim();
    name = (userData.name || userData.displayName || '').toLowerCase().trim();
  }

  // 1. Direct email match
  for (const adminEmail of ADMIN_EMAILS) {
    if (email === adminEmail || email.includes(adminEmail) || email.startsWith(adminEmail.split('@')[0])) {
      return true;
    }
  }

  // 2. Specific username or handle match
  if (
    username.includes('vickybhelave') ||
    username.includes('bhelavevicky') ||
    username.includes('vicky_bhelave') ||
    username === 'vicky'
  ) {
    return true;
  }

  // 3. Name match for primary user
  if (
    name.includes('vicky bhelave') ||
    name.includes('bhelave vicky') ||
    name.includes('paurnima bhelave')
  ) {
    return true;
  }

  return false;
}

export const VerifiedBadge: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <span className="inline-flex items-center text-[#00a8ff] shrink-0" title="Verified Admin">
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.55.6 10.92.6 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4zM9.9 17.25l-4.5-4.5 1.41-1.41 3.09 3.09 7.09-7.09 1.41 1.41-8.5 8.5z" />
    </svg>
  </span>
);
