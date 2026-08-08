import { getContactNotificationSettings } from './contactSettings';

// Web Audio API soft message arrival tone
export function playMessageArrivalSound(senderId?: string) {
  const globalMsgNotif = localStorage.getItem('calcchat_global_notify_messages') !== 'false';
  if (!globalMsgNotif) return;

  if (senderId) {
    const settings = getContactNotificationSettings(senderId);
    if (!settings.chatNotifications) {
      // Chat notification tone is OFF for this sender
      return;
    }
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Friendly dual-frequency chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 300);
  } catch (err) {
    console.warn('Message sound play error:', err);
  }
}
