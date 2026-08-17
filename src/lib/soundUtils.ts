import { getContactNotificationSettings } from './contactSettings';

// Set to track already-played message IDs to ensure incoming sound plays EXACTLY ONCE per message
const playedIncomingMsgIds = new Set<string>();
let lastIncomingSoundTime = 0;
let lastSentSoundTime = 0;

/**
 * Play a crisp, pleasant outgoing message "swoosh-pop" sound when sending a message.
 * Guaranteed to play exactly once per message send.
 */
export function playMessageSentSound() {
  const globalMsgNotif = localStorage.getItem('calcchat_global_notify_messages') !== 'false';
  if (!globalMsgNotif) return;

  const now = Date.now();
  // Prevent duplicate trigger bursts within 120ms
  if (now - lastSentSoundTime < 120) return;
  lastSentSoundTime = now;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pleasant rising pop (WhatsApp / iOS style outgoing message tone)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1450, ctx.currentTime + 0.055);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 150);
  } catch (err) {
    console.warn('Sent message sound play error:', err);
  }
}

/**
 * Play a beautiful, gentle incoming message chime when a new message arrives.
 * Guaranteed to play EXACTLY ONCE per message ID.
 */
export function playMessageArrivalSound(messageId?: string, senderId?: string) {
  const globalMsgNotif = localStorage.getItem('calcchat_global_notify_messages') !== 'false';
  if (!globalMsgNotif) return;

  if (senderId) {
    const settings = getContactNotificationSettings(senderId);
    if (!settings.chatNotifications) {
      // Chat notification tone is OFF for this sender
      return;
    }
  }

  // De-duplication: Ensure this message ID has not already triggered a sound
  if (messageId) {
    if (playedIncomingMsgIds.has(messageId)) {
      return;
    }
    playedIncomingMsgIds.add(messageId);
    // Keep set bounded to last 200 message IDs
    if (playedIncomingMsgIds.size > 200) {
      const firstKey = playedIncomingMsgIds.values().next().value;
      if (firstKey) playedIncomingMsgIds.delete(firstKey);
    }
  }

  const now = Date.now();
  // Prevent duplicate acoustic overlapping if multiple messages arrive within 100ms
  if (now - lastIncomingSoundTime < 100) return;
  lastIncomingSoundTime = now;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Note 1: First soft tone (G5 ~ 784 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, ctx.currentTime);

    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);

    // Note 2: Second sweet chime tone (C6 ~ 1046.5 Hz) slightly delayed for a melodious 2-tone chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.07);

    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.07);
    osc2.stop(ctx.currentTime + 0.22);

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 280);
  } catch (err) {
    console.warn('Message arrival sound play error:', err);
  }
}

