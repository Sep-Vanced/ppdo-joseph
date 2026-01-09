import { X } from "lucide-react";
import MainSheet from "./MainSheet";

interface ExpandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpandModal({ isOpen, onClose }: ExpandModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-1.5 right-4 z-50 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-md"
          title="Close"
        >
          <X className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
        </button>

        <div className="w-full h-full">
          <MainSheet />
        </div>
      </div>
    </div>
  );
}
