import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
