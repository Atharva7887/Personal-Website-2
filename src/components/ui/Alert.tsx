import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AlertProps {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function Alert({ 
  type, 
  message, 
  onClose, 
  autoClose = true,
  duration = 5000 
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  const colors = {
    success: 'bg-green-500/10 border-green-500 text-green-500',
    error: 'bg-red-500/10 border-red-500 text-red-500'
  };

  return (
    <div className={`${colors[type]} px-4 py-3 rounded border flex items-center justify-between`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="ml-4 hover:opacity-80"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}