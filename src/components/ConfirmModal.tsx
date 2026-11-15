import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Konfirmasi',
  cancelLabel = 'Batal',
  isConfirming = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-darker/60 backdrop-blur-sm">
      <div className="bg-surface-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-floating border border-border-subtle text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-50 text-status-success flex items-center justify-center mx-auto shadow-card">
          <span className="material-symbols-outlined text-[32px]">check_circle</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-headline-sm font-bold text-text-primary">{title}</h3>
          <p className="text-body-sm text-text-secondary leading-relaxed">{message}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-body-sm text-amber-800 flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-status-warning flex-shrink-0 mt-0.5">warning</span>
          <span>
            Tindakan ini permanen. Setelah dikonfirmasi, barang akan ditandai telah diserahterimakan dan keluar dari katalog aktif.
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-5 py-2.5 rounded-md text-label-md font-medium text-text-secondary hover:bg-surface-container transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-6 py-2.5 rounded-md text-label-md font-semibold text-white bg-status-success hover:opacity-90 disabled:opacity-50 shadow-card transition-all"
          >
            {isConfirming ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
