import React from 'react';
import { UserPlus, Check, X, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { FriendRequest } from '../types';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: FriendRequest[];
  onAccept: (requestId: string, senderId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onAccept,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[#0b141a] text-white border border-[#1f2c34] shadow-2xl p-6 relative overflow-hidden animate-scale-up max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2c34]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#25d366]/10 border border-[#25d366]/30 flex items-center justify-center text-[#25d366]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Friend Requests</h3>
              <p className="text-xs text-[#8696a0]">
                {requests.length === 0 ? 'No pending requests' : `${requests.length} incoming request${requests.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-[#8696a0]">
              <div className="w-16 h-16 rounded-full bg-[#111b21] flex items-center justify-center mb-3 border border-[#202c33]">
                <Users className="w-8 h-8 text-[#8696a0]" />
              </div>
              <p className="font-semibold text-sm text-white">No Friend Requests</p>
              <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
                When people send you a friend request using your username, they will appear here.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div 
                key={req.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111b21] border border-[#202c33] hover:border-[#25d366]/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={req.senderPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={req.senderDisplayName || req.senderUsername}
                    className="w-12 h-12 rounded-full object-cover border border-[#25d366]/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-white truncate">
                      {req.senderDisplayName || req.senderUsername}
                    </h4>
                    <p className="text-xs text-[#25d366] font-medium truncate">
                      @{req.senderUsername}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAccept(req.id, req.senderId)}
                    className="p-2.5 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] font-bold transition-all active:scale-95 shadow cursor-pointer"
                    title="Accept Friend Request"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => onReject(req.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
                    title="Reject Request"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1f2c34] text-center">
          <p className="text-[11px] text-[#8696a0] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#25d366]" />
            <span>Accepting unlocks Chat, Status, and Voice & Video Calling</span>
          </p>
        </div>

      </div>
    </div>
  );
};
