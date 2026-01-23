import { AlertTriangle, Info, AlertCircle, CheckCircle, X } from 'lucide-react';
import Button from '../ui/Button';

/**
 * ConfirmModal - Modal de confirmación reutilizable
 * Reemplaza los window.confirm() nativos con un diseño consistente
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Callback al cerrar (cancelar)
 * @param {function} onConfirm - Callback al confirmar
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje de confirmación
 * @param {string} confirmText - Texto del botón de confirmar (default: "Confirmar")
 * @param {string} cancelText - Texto del botón de cancelar (default: "Cancel·lar")
 * @param {string} variant - Variante visual: "danger" | "warning" | "info" | "success" (default: "warning")
 * @param {boolean} loading - Si está procesando la acción
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmació",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancel·lar",
  variant = "warning",
  loading = false
}) => {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonVariant: "danger"
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      buttonVariant: "primary"
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonVariant: "primary"
    },
    success: {
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      buttonVariant: "primary"
    }
  };

  const config = variants[variant] || variants.warning;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon className={config.iconColor} size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processant..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
