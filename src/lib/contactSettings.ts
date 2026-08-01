export interface ContactNotificationSettings {
  chatNotifications: boolean;
  callNotifications: boolean;
}

export function getContactNotificationSettings(contactId: string): ContactNotificationSettings {
  if (!contactId) return { chatNotifications: true, callNotifications: true };
  try {
    const raw = localStorage.getItem(`contact_notif_${contactId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        chatNotifications: typeof parsed.chatNotifications === 'boolean' ? parsed.chatNotifications : true,
        callNotifications: typeof parsed.callNotifications === 'boolean' ? parsed.callNotifications : true,
      };
    }
  } catch (e) {
    console.warn('Error reading contact notification settings:', e);
  }
  return { chatNotifications: true, callNotifications: true };
}

export function setContactNotificationSettings(
  contactId: string,
  settings: Partial<ContactNotificationSettings>
): ContactNotificationSettings {
  if (!contactId) return { chatNotifications: true, callNotifications: true };
  const current = getContactNotificationSettings(contactId);
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(`contact_notif_${contactId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving contact notification settings:', e);
  }
  return updated;
}
