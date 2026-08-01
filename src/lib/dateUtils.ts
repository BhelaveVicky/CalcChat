// Utility for formatting chat timestamps and grouping messages by date

export function parseMessageDate(raw: any): Date | null {
  if (!raw) return null;

  // Firestore Timestamp instance with toDate()
  if (typeof raw === 'object' && typeof raw.toDate === 'function') {
    try {
      return raw.toDate();
    } catch (e) {
      // ignore
    }
  }

  // Firestore Timestamp object { seconds, nanoseconds }
  if (typeof raw === 'object' && typeof raw.seconds === 'number') {
    return new Date(raw.seconds * 1000);
  }

  // JS Date
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }

  // Unix timestamp (number)
  if (typeof raw === 'number') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  // String representation
  if (typeof raw === 'string') {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}

// Format chat date header (Today, Yesterday, Monday, 30 July 2026)
export function formatChatDate(rawTimestamp: any): string {
  const date = parseMessageDate(rawTimestamp);
  if (!date) {
    if (typeof rawTimestamp === 'string' && rawTimestamp.trim().length > 0) {
      return rawTimestamp;
    }
    return 'Today';
  }

  const now = new Date();
  
  // Normalize dates to midnight for exact calendar day comparison
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = startOfNow.getTime() - startOfDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Format message time (10:45 AM)
export function formatMessageTime(rawTimestamp: any, fallbackTime?: string): string {
  const date = parseMessageDate(rawTimestamp);
  if (!date) {
    return fallbackTime || '10:45 AM';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Date key for grouping (e.g. YYYY-MM-DD)
export function getMessageDateKey(rawTimestamp: any): string {
  const date = parseMessageDate(rawTimestamp);
  if (!date) return 'today';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
