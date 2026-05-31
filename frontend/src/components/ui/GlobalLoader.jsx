import { useState, useEffect } from 'react';

export default function GlobalLoader() {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, 15000); // 15 segundos de timeout
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sav-dark space-y-8 p-6 text-center relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-sav-accent/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-white/5 border-t-sav-accent rounded-full animate-spin"></div>
          <div className="absolute inset-0 bg-sav-accent/20 blur-2xl rounded-full animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-white font-bold uppercase tracking-[0.4em] text-[11px] animate-pulse">Sincronizando Sistema</p>
            <p className="text-sav-muted text-[9px] font-medium uppercase tracking-[0.2em] mt-2 opacity-60">BCB Global Tech 2026</p>
          </div>
          
          {showError && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-4 max-w-xs mx-auto pt-6">
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                La conexión está tardando más de lo habitual. Por favor, verifica tu red.
              </p>
              <button 
                onClick={handleRetry}
                className="px-8 py-3.5 rounded-xl bg-white/5 text-white text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 active:scale-95 transition-all hover:bg-white/10 shadow-lg"
              >
                REINTENTAR ACCESO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
