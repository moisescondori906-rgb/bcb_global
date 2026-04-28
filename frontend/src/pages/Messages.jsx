import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell as BellIcon, 
  ChevronLeft as ChevronLeftIcon, 
  Calendar as CalendarIcon,
  MessageSquare as MessageIcon,
  Image as ImageIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import GlobalLoader from '../components/ui/GlobalLoader';

export default function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await api.users.mensajes();
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <Layout>
      <div className="fixed inset-0 bg-sav-dark -z-10" />
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-sav-primary/10 to-transparent blur-[80px] -z-10" />

      <main className="px-5 pt-6 pb-20 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4 px-1">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">Comunicados</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sav-primary animate-pulse" />
              <p className="text-[9px] font-black text-sav-muted uppercase tracking-widest">Avisos Oficiales</p>
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="space-y-5">
          {messages.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-sav-muted">
                <MessageIcon size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-white uppercase tracking-widest">Sin mensajes</p>
                <p className="text-[10px] text-sav-muted font-medium px-10">No hay comunicados oficiales en este momento.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card variant="glass" className="overflow-hidden border-white/5 group hover:border-sav-primary/30 transition-colors duration-500">
                  {msg.imagen_url && (
                    <div className="relative aspect-video w-full overflow-hidden bg-white/5">
                      <img 
                        src={msg.imagen_url} 
                        alt={msg.titulo}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-sav-dark via-transparent to-transparent opacity-60" />
                      <div className="absolute top-3 right-3">
                        <div className="bg-sav-primary/20 backdrop-blur-md border border-sav-primary/30 p-1.5 rounded-lg">
                          <ImageIcon size={14} className="text-sav-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <SparklesIcon size={12} className="text-sav-primary" />
                          <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                            {msg.titulo}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-sav-muted">
                          <CalendarIcon size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {new Date(msg.fecha).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-sav-muted font-medium leading-relaxed">
                      {msg.contenido}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-sav-primary flex items-center justify-center">
                          <BellIcon size={8} className="text-white" />
                        </div>
                        <span className="text-[8px] font-black text-sav-primary uppercase tracking-[0.2em]">BCB Global Oficial</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Brand Footer */}
        <div className="pt-4 pb-10">
          <p className="text-[8px] font-bold text-sav-muted text-center uppercase tracking-[0.4em] opacity-50">
            SAV Comunicaciones Institucionales
          </p>
        </div>
      </main>
    </Layout>
  );
}
