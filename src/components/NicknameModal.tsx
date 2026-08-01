import React, { useState, useEffect } from 'react';
import { User, Tag, Check, X, RotateCcw, Sparkles } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Contact } from '../types';

interface NicknameModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  contact,
  isOpen,
  onClose,
}) => {
  const { customNicknames, setCustomNickname, clearCustomNickname, settings } = useVault();
  const [nicknameInput, setNicknameInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const existingNickname = contact ? customNicknames[contact.id] || '' : '';

  useEffect(() => {
    if (contact) {
      setNicknameInput(customNicknames[contact.id] || '');
    }
  }, [contact, customNicknames, isOpen]);

  if (!isOpen || !contact) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      clearCustomNickname(contact.id);
      showToast('Nickname cleared! Using original profile name.');
      setTimeout(() => onClose(), 600);
      return;
    }

    setCustomNickname(contact.id, trimmed);
    showToast(`Nickname saved as "${trimmed}"!`);
    setTimeout(() => onClose(), 600);
  };

  const handleClear = () => {
    clearCustomNickname(contact.id);
    setNicknameInput('');
    showToast('Reset to original name!');
    setTimeout(() => onClose(), 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-[#111b21] text-white border border-[#202c33] shadow-2xl p-6 relative overflow-hidden animate-scale-up"
      >
        {/* Toast feedback pill */}
        {toastMsg && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-[#00a8ff] text-[#0b141a] px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#00a8ff]" />
            <h3 className="text-lg font-bold">Set Custom Name</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info Preview */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#202c33]/60 border border-white/5 mb-5">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-12 h-12 rounded-full object-cover border border-[#00a8ff]/40"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Original Name</p>
            <h4 className="text-base font-bold text-white truncate">{contact.name}</h4>
            {contact.username && (
              <p className="text-xs text-[#00a8ff]">@{contact.username}</p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Private Nickname <span className="text-slate-500">(Only visible to you)</span>
              </label>
              <span className={`text-[11px] font-mono font-semibold ${
                nicknameInput.length >= 30 ? 'text-rose-400 font-bold' : 'text-slate-400'
              }`}>
                {nicknameInput.length}/30
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                maxLength={30}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder={`e.g. Best Friend ❤️ or ${contact.name.split(' ')[0]}`}
                className="w-full px-4 py-3 rounded-2xl bg-[#202c33] text-white border border-transparent focus:border-[#00a8ff] focus:outline-none text-sm transition-all placeholder:text-slate-500 font-medium"
                autoFocus
              />
              {nicknameInput && (
                <button
                  type="button"
                  onClick={() => setNicknameInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              🔒 This nickname is completely private to your account and will never overwrite {contact.name}'s profile name for anyone else.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-bold text-sm shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Custom Name</span>
            </button>

            {existingNickname && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Original Name ({contact.name})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
