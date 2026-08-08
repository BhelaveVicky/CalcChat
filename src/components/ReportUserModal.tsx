import React, { useState } from 'react';
import { Flag, X, ShieldAlert, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
    username?: string;
  } | null;
}

const PRESET_REASONS = [
  'Harassment or Hate Speech',
  'Spam, Fraud or Scam',
  'Inappropriate Profile or Media',
  'Fake Profile or Impersonation',
  'Unwanted Messaging / Stalking',
  'Other Reason',
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  reportedUser,
}) => {
  const { submitUserReport, settings } = useVault();
  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';

  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customDetails, setCustomDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !reportedUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMsg('Please select or provide a reason for the report.');
      return;
    }

    const fullReason = customDetails.trim()
      ? `${selectedReason}: ${customDetails.trim()}`
      : selectedReason;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (submitUserReport) {
        await submitUserReport(reportedUser.id, fullReason, reportedUser);
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setCustomDetails('');
        setSelectedReason(PRESET_REASONS[0]);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border transition-all ${
          isDark
            ? 'bg-[#111b21] border-[#222e35] text-[#e9edef]'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-red-50 border-red-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Flag className="w-5 h-5 fill-red-500/20" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-500">Report User</h3>
              <p className={`text-xs ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                Help keep CalcChat safe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'hover:bg-[#3b4a54] text-[#8596a0]' : 'hover:bg-gray-200 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-scale-in">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold">Report Submitted</h4>
            <p className={`text-xs max-w-xs mx-auto ${isDark ? 'text-[#8596a0]' : 'text-gray-600'}`}>
              Thank you for notifying us. The report has been sent directly to the Admin Panel for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Reported User Summary */}
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                isDark ? 'bg-[#202c33]/60 border-[#222e35]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <img
                src={reportedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={reportedUser.name}
                className="w-11 h-11 rounded-full object-cover border border-gray-500/30 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm truncate">{reportedUser.name}</h4>
                {reportedUser.username && (
                  <p className={`text-xs truncate ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                    @{reportedUser.username}
                  </p>
                )}
                {reportedUser.email && (
                  <p className={`text-[11px] truncate font-mono ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                    {reportedUser.email}
                  </p>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Preset Reason */}
            <div>
              <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-[#e9edef]' : 'text-gray-700'}`}>
                Reason for report <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {PRESET_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                      selectedReason === reason
                        ? isDark
                          ? 'bg-red-500/20 border-red-500/50 text-red-300 font-medium'
                          : 'bg-red-50 border-red-300 text-red-700 font-medium'
                        : isDark
                        ? 'bg-[#202c33]/40 border-[#222e35] hover:bg-[#202c33]'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-red-500 w-3.5 h-3.5"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Details Input */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#e9edef]' : 'text-gray-700'}`}>
                Additional details (optional)
              </label>
              <textarea
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Explain what happened or add specific context for admins..."
                rows={3}
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#202c33] border-[#222e35] text-[#e9edef] focus:border-red-500/60 placeholder-[#8596a0]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isDark ? 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef]' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
