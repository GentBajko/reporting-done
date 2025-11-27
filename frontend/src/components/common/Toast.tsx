import { useEffect } from "react";
import { HiCheckCircle, HiExclamationCircle, HiX } from "react-icons/hi";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 4000 }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseClasses =
    "fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 z-50 max-w-md";

  const typeClasses = {
    success: "bg-emerald-50 border border-emerald-200 text-emerald-800",
    error: "bg-red-50 border border-red-200 text-red-800",
    info: "bg-blue-50 border border-blue-200 text-blue-800",
  };

  const iconClasses = {
    success: "text-emerald-500",
    error: "text-red-500",
    info: "text-blue-500",
  };

  const Icon = type === "error" ? HiExclamationCircle : HiCheckCircle;

  return (
    <div
      className={`${baseClasses} ${typeClasses[type]} ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconClasses[type]}`} />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <HiX className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ transform: `translateY(-${index * 8}px)` }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;

