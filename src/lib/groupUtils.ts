export interface GroupMemberItem {
  id: string;
  name: string;
  avatar?: string;
  role: 'Creator' | 'Admin' | 'Member';
}

export function getGroupMembersList(
  groupContact: any,
  allRegisteredUsers: any[] = [],
  contacts: any[] = [],
  currentUser?: any
): GroupMemberItem[] {
  if (!groupContact) return [];

  const targetId = groupContact.id || groupContact.uid || groupContact.groupId;
  const matchedInContacts = (contacts || []).find(c =>
    (c.id && c.id === targetId) ||
    (c.groupId && c.groupId === targetId) ||
    (c.name && c.name.toLowerCase() === (groupContact.name || '').toLowerCase())
  );

  const uidsSet = new Set<string>();
  const namesSet = new Set<string>();

  const collectFrom = (obj: any) => {
    if (!obj) return;
    if (Array.isArray(obj.members)) obj.members.forEach((m: any) => m && uidsSet.add(String(m)));
    if (Array.isArray(obj.memberUids)) obj.memberUids.forEach((m: any) => m && uidsSet.add(String(m)));
    if (Array.isArray(obj.groupMembers)) obj.groupMembers.forEach((m: any) => m && namesSet.add(String(m)));
    if (Array.isArray(obj.memberNames)) obj.memberNames.forEach((m: any) => m && namesSet.add(String(m)));
    if (Array.isArray(obj.followers)) obj.followers.forEach((m: any) => m && uidsSet.add(String(m)));
    if (obj.createdBy) uidsSet.add(String(obj.createdBy));
    if (Array.isArray(obj.admins)) obj.admins.forEach((m: any) => m && uidsSet.add(String(m)));

    const statusStr = obj.status || obj.bio || obj.about || '';
    if (typeof statusStr === 'string' && statusStr.toLowerCase().includes('members:')) {
      const afterColon = statusStr.split(/members:/i)[1];
      if (afterColon) {
        afterColon.split(',').forEach(part => {
          const cleanName = part.replace(/\.\.\.$/, '').trim();
          if (cleanName) namesSet.add(cleanName);
        });
      }
    }
  };

  collectFrom(groupContact);
  if (matchedInContacts) {
    collectFrom(matchedInContacts);
  }

  const creatorId = groupContact.createdBy || matchedInContacts?.createdBy || '';
  const adminIds: string[] = Array.isArray(groupContact.admins)
    ? groupContact.admins
    : (Array.isArray(matchedInContacts?.admins) ? matchedInContacts.admins : []);

  const memberMap = new Map<string, GroupMemberItem>();

  const processItem = (item: string, fallbackName?: string) => {
    if (!item) return;
    const cleanItem = String(item).trim();
    if (!cleanItem) return;

    // Search in registered users and contacts
    const foundUser = (allRegisteredUsers || []).find(u =>
      (u.uid && String(u.uid) === cleanItem) ||
      (u.id && String(u.id) === cleanItem) ||
      (u.username && u.username.toLowerCase() === cleanItem.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase() === cleanItem.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === cleanItem.toLowerCase())
    );

    const foundContact = (contacts || []).find(c =>
      (c.id && String(c.id) === cleanItem) ||
      (c.username && c.username.toLowerCase() === cleanItem.toLowerCase()) ||
      (c.name && c.name.toLowerCase() === cleanItem.toLowerCase())
    );

    let resolvedName = fallbackName || cleanItem;
    let resolvedAvatar: string | undefined = undefined;

    if (currentUser && (cleanItem === currentUser.id || cleanItem === currentUser.firebaseUid || cleanItem === currentUser.uid)) {
      resolvedName = currentUser.name ? `${currentUser.name} (You)` : 'You';
      resolvedAvatar = currentUser.avatar;
    } else if (foundUser) {
      resolvedName = foundUser.displayName || foundUser.name || resolvedName;
      resolvedAvatar = foundUser.photoURL || foundUser.avatar;
    } else if (foundContact) {
      resolvedName = foundContact.name || resolvedName;
      resolvedAvatar = foundContact.avatar;
    }

    if (currentUser?.name && (resolvedName === currentUser.name || cleanItem === currentUser.id || cleanItem === currentUser.uid)) {
      if (!resolvedName.includes('(You)')) {
        resolvedName = `${currentUser.name} (You)`;
      }
    }

    let role: 'Creator' | 'Admin' | 'Member' = 'Member';
    if (creatorId && (cleanItem === creatorId || (currentUser && (creatorId === currentUser.id || creatorId === currentUser.uid)))) {
      role = 'Creator';
    } else if (adminIds.includes(cleanItem)) {
      role = 'Admin';
    }

    const key = resolvedName.toLowerCase();
    if (!memberMap.has(key)) {
      memberMap.set(key, {
        id: cleanItem,
        name: resolvedName,
        avatar: resolvedAvatar,
        role,
      });
    }
  };

  // Process UIDs first
  uidsSet.forEach(uid => processItem(uid));

  // Process names second
  namesSet.forEach(name => processItem(name, name));

  // Fallback: If still 0 members found and currentUser exists, add currentUser as Creator/Member
  if (memberMap.size === 0 && currentUser) {
    const myId = currentUser.id || currentUser.uid || currentUser.firebaseUid || 'me';
    processItem(myId, currentUser.name ? `${currentUser.name} (You)` : 'You');
  }

  return Array.from(memberMap.values());
}
