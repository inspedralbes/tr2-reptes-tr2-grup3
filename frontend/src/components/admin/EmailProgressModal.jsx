/**
 * EmailProgressModal.jsx
 * 
 * Modal para visualizar el progreso de envío de emails en tiempo real
 * Usa Server-Sent Events (SSE) para recibir actualizaciones del backend
 */
import { useState, useEffect, useRef } from "react";
import { X, Mail, CheckCircle, XCircle, Loader2, Users, GraduationCap } from "lucide-react";

const EmailProgressModal = ({ isOpen, onClose, type, periodId, periodName }) => {
  const [progress, setProgress] = useState({
    status: 'idle', // idle, connecting, running, completed, error
    total: 0,
    sent: 0,
    errors: 0,
    current: null,
    logs: []
  });
  
  const eventSourceRef = useRef(null);
  const logsEndRef = useRef(null);

  // Auto-scroll a los logs más recientes
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progress.logs]);

  // Iniciar conexión SSE cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem('enginy_token');
    if (!token) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        logs: [{ type: 'error', message: 'Sessió no vàlida. Torna a iniciar sessió.', time: new Date() }]
      }));
      return;
    }

    setProgress({
      status: 'connecting',
      total: 0,
      sent: 0,
      errors: 0,
      current: null,
      logs: [{ type: 'info', message: 'Connectant amb el servidor...', time: new Date() }]
    });

    // Crear conexión SSE
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const url = `${apiUrl}/emails/send-stream?type=${type}&periodId=${periodId || ''}&token=${token}`;
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setProgress(prev => ({
        ...prev,
        status: 'running',
        logs: [...prev.logs, { type: 'info', message: 'Connexió establerta. Cercant destinataris...', time: new Date() }]
      }));
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case 'start':
            if (data.total === 0) {
              setProgress(prev => ({
                ...prev,
                status: 'completed',
                total: 0,
                logs: [...prev.logs, { 
                  type: 'warning', 
                  message: 'No s\'han trobat destinataris per enviar credencials.', 
                  time: new Date() 
                }]
              }));
              eventSource.close();
            } else {
              setProgress(prev => ({
                ...prev,
                total: data.total,
                logs: [...prev.logs, { 
                  type: 'info', 
                  message: `Trobats ${data.total} destinataris. Iniciant enviament...`, 
                  time: new Date() 
                }]
              }));
            }
            break;

          case 'sending':
            setProgress(prev => ({
              ...prev,
              current: data.email,
              logs: [...prev.logs, { 
                type: 'pending', 
                message: `Enviant a ${data.name} (${data.email})...`, 
                time: new Date() 
              }]
            }));
            break;

          case 'sent':
            setProgress(prev => ({
              ...prev,
              sent: prev.sent + 1,
              logs: [...prev.logs, { 
                type: 'success', 
                message: `✓ Enviat a ${data.name} (${data.email})`, 
                time: new Date() 
              }]
            }));
            break;

          case 'error':
            setProgress(prev => ({
              ...prev,
              errors: prev.errors + 1,
              logs: [...prev.logs, { 
                type: 'error', 
                message: `✗ Error amb ${data.email}: ${data.error}`, 
                time: new Date() 
              }]
            }));
            break;

          case 'complete':
            setProgress(prev => ({
              ...prev,
              status: 'completed',
              sent: data.sent,
              errors: data.errors,
              logs: [...prev.logs, { 
                type: 'complete', 
                message: `Procés completat: ${data.sent} enviats, ${data.errors} errors`, 
                time: new Date() 
              }]
            }));
            eventSource.close();
            break;

          case 'no-recipients':
            setProgress(prev => ({
              ...prev,
              status: 'completed',
              logs: [...prev.logs, { 
                type: 'warning', 
                message: 'No s\'han trobat destinataris. Comprova que hi ha coordinadors/professors registrats amb email.', 
                time: new Date() 
              }]
            }));
            eventSource.close();
            break;

          case 'auth-error':
            setProgress(prev => ({
              ...prev,
              status: 'error',
              logs: [...prev.logs, { 
                type: 'error', 
                message: data.message || 'Error d\'autenticació. Torna a iniciar sessió.', 
                time: new Date() 
              }]
            }));
            eventSource.close();
            break;
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      // Verificar si es un error de autenticación
      setProgress(prev => {
        // Si ya completó o ya tiene error, no cambiar
        if (prev.status === 'completed' || prev.status === 'error') {
          return prev;
        }
        return {
          ...prev,
          status: 'error',
          logs: [...prev.logs, { 
            type: 'error', 
            message: prev.total === 0 
              ? 'No s\'han trobat destinataris per enviar credencials.' 
              : 'Error de connexió amb el servidor. Comprova la connexió i torna a intentar-ho.', 
            time: new Date() 
          }]
        };
      });
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isOpen, type, periodId]);

  // Cerrar conexión al cerrar modal
  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    onClose();
  };

  if (!isOpen) return null;

  const progressPercentage = progress.total > 0 
    ? Math.round(((progress.sent + progress.errors) / progress.total) * 100) 
    : 0;

  const getTypeLabel = () => {
    switch (type) {
      case 'coordinators': return 'Coordinadors de Centre';
      case 'teachers': return 'Professors Assignats';
      default: return 'Destinataris';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'coordinators': return <Users size={24} />;
      case 'teachers': return <GraduationCap size={24} />;
      default: return <Mail size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                {getTypeIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold">Enviament de Credencials</h2>
                <p className="text-blue-100 mt-1">{getTypeLabel()}</p>
                {periodName && (
                  <p className="text-blue-200 text-sm mt-1">Període: {periodName}</p>
                )}
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
              <div className="text-xs text-blue-700 uppercase tracking-wide font-semibold">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{progress.sent}</div>
              <div className="text-xs text-green-700 uppercase tracking-wide font-semibold">Enviats</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-600">{progress.errors}</div>
              <div className="text-xs text-red-700 uppercase tracking-wide font-semibold">Errors</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">{progressPercentage}%</span>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {progress.status === 'connecting' && (
              <>
                <Loader2 className="animate-spin text-blue-500" size={18} />
                <span className="text-blue-600 font-medium">Connectant...</span>
              </>
            )}
            {progress.status === 'running' && (
              <>
                <Loader2 className="animate-spin text-blue-500" size={18} />
                <span className="text-blue-600 font-medium">
                  Enviant a {progress.current || '...'}
                </span>
              </>
            )}
            {progress.status === 'completed' && (
              <>
                <CheckCircle className="text-green-500" size={18} />
                <span className="text-green-600 font-medium">Procés completat!</span>
              </>
            )}
            {progress.status === 'error' && (
              <>
                <XCircle className="text-red-500" size={18} />
                <span className="text-red-600 font-medium">Error en el procés</span>
              </>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-[200px] max-h-[300px]">
          <div className="space-y-1 font-mono text-sm">
            {progress.logs.map((log, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 p-2 rounded ${
                  log.type === 'success' ? 'bg-green-100 text-green-800' :
                  log.type === 'error' ? 'bg-red-100 text-red-800' :
                  log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  log.type === 'complete' ? 'bg-blue-100 text-blue-800 font-semibold' :
                  log.type === 'pending' ? 'bg-gray-100 text-gray-600' :
                  'bg-white text-gray-700'
                }`}
              >
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {log.time.toLocaleTimeString('ca-ES')}
                </span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleClose}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              progress.status === 'completed' || progress.status === 'error'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={progress.status === 'running' || progress.status === 'connecting'}
          >
            {progress.status === 'running' || progress.status === 'connecting' 
              ? 'Procés en curs...' 
              : 'Tancar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailProgressModal;
