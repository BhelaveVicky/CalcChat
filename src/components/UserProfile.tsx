import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useVault } from '../context/VaultContext';
import { ProfileCard, ProfileData } from './ProfileCard';
import { FollowersList, FollowerUser } from './FollowersList';
import { FollowingList, FollowingUser } from './FollowingList';
import { ArrowLeft, Loader2, Edit3, X, Check } from 'lucide-react';

interface UserProfileProps {
  targetUserId?: string;
  onBack?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ targetUserId, onBack }) => {
  const params = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { 
    authUser, 
    user: currentUser, 
    settings, 
    updateProfile, 
    setActiveContactId, 
    setActiveTab, 
    contacts, 
    messages,
    sendFriendRequest,
    acceptFriendRequest,
    pendingFriendRequests
  } = useVault();
  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';

  // Determine effective user ID to view
  const effectiveUserId = targetUserId || params.userId || (authUser ? authUser.uid : currentUser.id);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [followersUsers, setFollowersUsers] = useState<FollowerUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);

  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);

  // Edit Profile Modal states (for own profile)
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Is current logged in user following this target user?
  const myUid = authUser?.uid || currentUser.id;
  const isSelf = effectiveUserId === myUid || effectiveUserId === 'me';
  const isFollowing = profileData?.followers?.includes(myUid) || false;

  const prevUserIdRef = useRef<string | null>(null);

  // Fetch target user profile from Firestore
  useEffect(() => {
    let isMounted = true;
    
    // Only show full loading screen if switching to a new user or if profileData is missing
    if (prevUserIdRef.current !== effectiveUserId || !profileData) {
      setLoading(true);
      setError(null);
    }
    prevUserIdRef.current = effectiveUserId;

    const fetchProfile = async () => {
      try {
        if (!effectiveUserId || effectiveUserId === 'me') {
          // Self profile
          if (isMounted) {
            setProfileData({
              uid: myUid,
              id: myUid,
              name: currentUser.name || authUser?.displayName || 'CalChat User',
              username: currentUser.username || 'calchat_user',
              photoURL: currentUser.avatar || authUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              bio: currentUser.status || currentUser.about || '"An emptiholic heart with quiet dreams" 🌙 💖 🥀',
              status: currentUser.status,
              followers: [],
              following: [],
              isOnline: true,
            });
          }
        } else if (db && effectiveUserId && effectiveUserId !== 'me') {
          const userDocRef = doc(db, 'users', effectiveUserId);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            if (isMounted) {
              setProfileData({
                uid: snap.id,
                id: snap.id,
                name: data.displayName || data.name || 'CalChat User',
                username: data.username || 'user',
                photoURL: data.photoURL || data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                bio: data.bio || data.status || data.about || '"An emptiholic heart with quiet dreams" 🌙 💖 🥀',
                status: data.status,
                followers: Array.isArray(data.followers) ? data.followers : [],
                following: Array.isArray(data.following) ? data.following : [],
                isOnline: data.online || false,
              });
            }
          } else {
            // Check in contacts fallback
            const matchContact = contacts.find(c => c.id === effectiveUserId);
            if (matchContact && isMounted) {
              setProfileData({
                uid: matchContact.id,
                id: matchContact.id,
                name: matchContact.name,
                username: matchContact.username || matchContact.name.toLowerCase().replace(/\s+/g, '_'),
                photoURL: matchContact.avatar,
                bio: matchContact.status || matchContact.about || '"An emptiholic heart with quiet dreams" 🌙 💖 🥀',
                followers: [],
                following: [],
                isOnline: matchContact.isOnline,
              });
            } else if (isMounted) {
              // Create default view
              setProfileData({
                uid: effectiveUserId,
                id: effectiveUserId,
                name: 'CalChat User',
                username: 'user',
                photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                bio: '"An emptiholic heart with quiet dreams" 🌙 💖 🥀',
                followers: [],
                following: [],
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        if (isMounted && !profileData) setError('Failed to load profile details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [effectiveUserId, myUid]);

  const followersKey = (profileData?.followers || []).join(',');
  const followingKey = (profileData?.following || []).join(',');

  // Load followers list user objects
  useEffect(() => {
    if (!profileData?.followers || profileData.followers.length === 0) {
      setFollowersUsers([]);
      return;
    }

    let isMounted = true;
    const loadFollowers = async () => {
      try {
        const list: FollowerUser[] = [];
        for (const uid of profileData.followers || []) {
          if (db) {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) {
              const d = snap.data();
              list.push({
                uid: snap.id,
                name: d.displayName || d.name || 'User',
                username: d.username || 'user',
                photoURL: d.photoURL || d.avatar,
                bio: d.bio || d.status,
              });
            } else {
              list.push({ uid, name: 'User', username: 'user' });
            }
          }
        }
        if (isMounted) setFollowersUsers(list);
      } catch (e) {
        console.error('Error loading followers list:', e);
      }
    };

    loadFollowers();
    return () => { isMounted = false; };
  }, [followersKey]);

  // Load following list user objects
  useEffect(() => {
    if (!profileData?.following || profileData.following.length === 0) {
      setFollowingUsers([]);
      return;
    }

    let isMounted = true;
    const loadFollowing = async () => {
      try {
        const list: FollowingUser[] = [];
        for (const uid of profileData.following || []) {
          if (db) {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) {
              const d = snap.data();
              list.push({
                uid: snap.id,
                name: d.displayName || d.name || 'User',
                username: d.username || 'user',
                photoURL: d.photoURL || d.avatar,
                bio: d.bio || d.status,
              });
            } else {
              list.push({ uid, name: 'User', username: 'user' });
            }
          }
        }
        if (isMounted) setFollowingUsers(list);
      } catch (e) {
        console.error('Error loading following list:', e);
      }
    };

    loadFollowing();
    return () => { isMounted = false; };
  }, [followingKey]);

  // Follow / Unfollow Toggle handler
  const handleFollowToggle = async () => {
    if (!myUid || !profileData || isSelf) return;

    const targetUid = profileData.uid;
    const currentlyFollowing = profileData.followers?.includes(myUid);

    // Optimistic UI update
    setProfileData(prev => {
      if (!prev) return prev;
      const currentFollowers = prev.followers || [];
      const updatedFollowers = currentlyFollowing
        ? currentFollowers.filter(id => id !== myUid)
        : [...currentFollowers, myUid];

      return {
        ...prev,
        followers: updatedFollowers,
      };
    });

    try {
      if (currentlyFollowing) {
        // Unfollow
        if (db) {
          const myDocRef = doc(db, 'users', myUid);
          const targetDocRef = doc(db, 'users', targetUid);
          await updateDoc(targetDocRef, { followers: arrayRemove(myUid) }).catch(() => {});
          await updateDoc(myDocRef, { following: arrayRemove(targetUid) }).catch(() => {});
        }
      } else {
        // Check if there is an incoming pending request from this user
        const incomingReq = pendingFriendRequests.find(r => r.senderId === targetUid && r.status === 'pending');
        if (incomingReq) {
          // Accept the existing request
          await acceptFriendRequest(incomingReq.id, targetUid);
        } else {
          // Send follow / friend request
          await sendFriendRequest(targetUid);
          if (db) {
            const myDocRef = doc(db, 'users', myUid);
            const targetDocRef = doc(db, 'users', targetUid);
            await updateDoc(targetDocRef, { followers: arrayUnion(myUid) }).catch(() => {});
            await updateDoc(myDocRef, { following: arrayUnion(targetUid) }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  // Open Chat with user
  const handleMessageClick = () => {
    if (profileData) {
      setActiveContactId(profileData.uid);
      setActiveTab('chats');
      navigate('/');
    }
  };

  // Back button handler
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Open Edit Profile modal
  const handleOpenEditModal = () => {
    setEditName(profileData?.name || currentUser.name || '');
    setEditUsername(profileData?.username || currentUser.username || '');
    setEditBio(profileData?.bio || currentUser.status || '');
    setShowEditModal(true);
  };

  // Save Edit Profile
  const handleSaveEditProfile = async () => {
    setIsSavingEdit(true);
    try {
      await updateProfile({
        name: editName.trim() || currentUser.name,
        username: editUsername.trim() || currentUser.username,
        status: editBio.trim() || currentUser.status,
      });

      if (db && authUser) {
        await updateDoc(doc(db, 'users', authUser.uid), {
          displayName: editName.trim(),
          username: editUsername.trim(),
          bio: editBio.trim(),
          status: editBio.trim(),
        }).catch(() => {});
      }

      setProfileData(prev => prev ? {
        ...prev,
        name: editName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim(),
      } : prev);

      setShowEditModal(false);
    } catch (e) {
      console.error('Save profile error:', e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-8 transition-colors ${
        isDark ? 'bg-[#0b141a] text-[#8696a0]' : 'bg-white text-gray-500'
      }`}>
        <Loader2 className="w-10 h-10 text-[#00a8ff] animate-spin mb-3" />
        <p className="text-sm font-semibold animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${
        isDark ? 'bg-[#0b141a] text-[#8696a0]' : 'bg-white text-gray-500'
      }`}>
        <p className="text-base font-bold mb-4">{error || 'User profile not found'}</p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 bg-[#00a8ff] text-[#0b141a] rounded-xl font-bold text-sm cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col overflow-y-auto ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      {/* Instagram Profile Card */}
      <ProfileCard
        user={profileData}
        currentUserUid={myUid}
        isFollowing={isFollowing}
        messagesList={profileData ? (messages[profileData.uid] || messages[profileData.id || ''] || []) : []}
        onFollowToggle={handleFollowToggle}
        onMessageClick={handleMessageClick}
        onEditProfileClick={handleOpenEditModal}
        onFollowersClick={() => setShowFollowersModal(true)}
        onFollowingClick={() => setShowFollowingModal(true)}
        onBackClick={handleBack}
        isDark={isDark}
      />

      {/* Followers Modal */}
      <FollowersList
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followersUsers}
        onSelectUser={(uid) => {
          setShowFollowersModal(false);
          navigate(`/profile/${uid}`);
        }}
        isDark={isDark}
      />

      {/* Following Modal */}
      <FollowingList
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={followingUsers}
        onSelectUser={(uid) => {
          setShowFollowingModal(false);
          navigate(`/profile/${uid}`);
        }}
        isDark={isDark}
      />

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#202c33]">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#00a8ff]" /> Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#00a8ff] ${
                    isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#00a8ff] ${
                    isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Bio / About</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:border-[#00a8ff] resize-none ${
                    isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEditProfile}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#00a8ff] text-[#0b141a] hover:bg-[#0088cc] flex items-center justify-center gap-2"
              >
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
