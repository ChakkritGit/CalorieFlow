import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'confirm';
}

export const CustomModal: React.FC<ModalProps> = ({
  isOpen, onClose, onConfirm, title, message, type = 'info'
}) => {
  if (!isOpen) return null;

  const icons = {
    info: <HelpCircle className="text-blue-500" size={48} />,
    success: <CheckCircle2 className="text-green-500" size={48} />,
    error: <AlertCircle className="text-red-500" size={48} />,
    confirm: <HelpCircle className="text-orange-500" size={48} />,
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-4">{icons[type]}</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 mb-6 whitespace-pre-wrap">{message}</p>

          <div className="flex w-full gap-3">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => { onConfirm?.(); onClose(); }}
                  className="flex-1 py-3 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 cursor-pointer"
                >
                  ยืนยัน
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-medium text-white bg-slate-800 hover:bg-slate-900 cursor-pointer"
              >
                ตกลง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};