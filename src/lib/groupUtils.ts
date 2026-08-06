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
  currentUser?: any,
  groupContacts: any[] = []
): GroupMemberItem[] {
  if (!groupContact) return [];

  const targetId = groupContact.id || groupContact.uid || groupContact.groupId;
  
  // Find matching group object in groupContacts or contacts for fresh data
  const matchedInGroupContacts = (groupContacts || []).find(g =>
    (g.id && g.id === targetId) ||
    (g.groupId && g.groupId === targetId)
  );
  const matchedInContacts = (contacts || []).find(c =>
    (c.id && c.id === targetId) ||
    (c.groupId && c.groupId === targetId)
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
    if (obj.ownerId) uidsSet.add(String(obj.ownerId));
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
  if (matchedInGroupContacts) collectFrom(matchedInGroupContacts);
  if (matchedInContacts) collectFrom(matchedInContacts);

  const creatorId = groupContact.createdBy || matchedInGroupContacts?.createdBy || matchedInContacts?.createdBy || groupContact.ownerId || matchedInGroupContacts?.ownerId || matchedInContacts?.ownerId || '';
  const adminIds: string[] = Array.isArray(groupContact.admins)
    ? groupContact.admins
    : (Array.isArray(matchedInGroupContacts?.admins) ? matchedInGroupContacts.admins : (Array.isArray(matchedInContacts?.admins) ? matchedInContacts.admins : []));

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
      (u.name && u.name.toLowerCase() === cleanItem.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === cleanItem.toLowerCase())
    );

    const foundContact = (contacts || []).find(c =>
      (c.id && String(c.id) === cleanItem) ||
      (c.username && c.username.toLowerCase() === cleanItem.toLowerCase()) ||
      (c.name && c.name.toLowerCase() === cleanItem.toLowerCase())
    );

    const isCurrentUser = Boolean(currentUser && (
      cleanItem === currentUser.id ||
      cleanItem === currentUser.firebaseUid ||
      cleanItem === currentUser.uid ||
      (currentUser.name && cleanItem.toLowerCase() === currentUser.name.toLowerCase()) ||
      (currentUser.username && cleanItem.toLowerCase() === currentUser.username.toLowerCase()) ||
      cleanItem.toLowerCase().includes('(you)')
    ));

    let resolvedName = fallbackName || cleanItem;
    let resolvedAvatar: string | undefined = undefined;

    if (isCurrentUser) {
      resolvedName = currentUser.name ? `${currentUser.name} (You)` : 'You';
      resolvedAvatar = currentUser.avatar || currentUser.photoURL;
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

    // Role assignment:
    // Creator should ONLY be assigned if THIS specific cleanItem/member matches creatorId!
    let role: 'Creator' | 'Admin' | 'Member' = 'Member';

    const isThisMemberCreator = Boolean(
      creatorId && (
        cleanItem === creatorId ||
        (foundUser && (foundUser.uid === creatorId || foundUser.id === creatorId || foundUser.username === creatorId)) ||
        (foundContact && (foundContact.id === creatorId || foundContact.username === creatorId)) ||
        (isCurrentUser && (creatorId === currentUser.id || creatorId === currentUser.uid || creatorId === currentUser.firebaseUid || creatorId === currentUser.username))
      )
    );

    if (isThisMemberCreator) {
      role = 'Creator';
    } else if (adminIds.includes(cleanItem) || (foundUser && (adminIds.includes(foundUser.uid) || adminIds.includes(foundUser.id)))) {
      role = 'Admin';
    }

    const userIdentifier = foundUser?.uid || foundUser?.id || foundContact?.id || (isCurrentUser ? (currentUser.id || currentUser.uid) : null);
    const cleanResolvedName = resolvedName.replace(/\s*\(You\)$/i, '').trim().toLowerCase();
    const key = userIdentifier ? `id_${userIdentifier}` : `name_${cleanResolvedName}`;

    if (!memberMap.has(key)) {
      memberMap.set(key, {
        id: userIdentifier || cleanItem,
        name: resolvedName,
        avatar: resolvedAvatar,
        role,
      });
    } else {
      // If key exists but the role is 'Creator' or 'Admin', elevate role
      const existing = memberMap.get(key)!;
      if (role === 'Creator' || (role === 'Admin' && existing.role === 'Member')) {
        memberMap.set(key, {
          ...existing,
          role,
          id: existing.id || userIdentifier || cleanItem,
          avatar: existing.avatar || resolvedAvatar,
        });
      }
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
