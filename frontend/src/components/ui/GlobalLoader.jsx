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
    <div className="min-h-screen flex flex-col items-center justify-center bg-sav-dark space-y-6 p-6 text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/5 border-t-sav-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 bg-sav-primary/20 blur-xl rounded-full animate-pulse"></div>
      </div>
      <div className="text-center space-y-4">
        <div>
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Cargando BCB Global</p>
          <p className="text-sav-muted text-[8px] uppercase tracking-widest mt-2">Institutional Grade Platform</p>
        </div>
        
        {showError && (
          <div className="animate-fade-in space-y-4 max-w-xs mx-auto pt-4">
            <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              El servidor está tardando más de lo esperado en responder.
            </p>
            <button 
              onClick={handleRetry}
              className="px-6 py-3 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-95 transition-all hover:bg-white/20"
            >
              Reintentar Conexión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
