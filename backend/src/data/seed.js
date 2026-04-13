import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const levels = [
  { id: 'l1', codigo: 'Internar', nombre: 'Internar', deposito: 0, ingreso_diario: 2.60, num_tareas_diarias: 2, comision_por_tarea: 1.30, orden: 0, activo: true },
  { id: 'l2', codigo: 'GLOBAL 1', nombre: 'GLOBAL 1', deposito: 200.00, ingreso_diario: 7.20, num_tareas_diarias: 4, comision_por_tarea: 1.80, orden: 1, activo: true },
  { id: 'l3', codigo: 'GLOBAL 2', nombre: 'GLOBAL 2', deposito: 720.00, ingreso_diario: 25.76, num_tareas_diarias: 8, comision_por_tarea: 3.22, orden: 2, activo: true },
  { id: 'l4', codigo: 'GLOBAL 3', nombre: 'GLOBAL 3', deposito: 2830.00, ingreso_diario: 101.40, num_tareas_diarias: 15, comision_por_tarea: 6.76, orden: 3, activo: true },
  { id: 'l5', codigo: 'GLOBAL 4', nombre: 'GLOBAL 4', deposito: 9150.00, ingreso_diario: 339.90, num_tareas_diarias: 30, comision_por_tarea: 11.33, orden: 4, activo: true },
  { id: 'l6', codigo: 'GLOBAL 5', nombre: 'GLOBAL 5', deposito: 28200.00, ingreso_diario: 1045.80, num_tareas_diarias: 60, comision_por_tarea: 17.43, orden: 5, activo: true },
  { id: 'l7', codigo: 'GLOBAL 6', nombre: 'GLOBAL 6', deposito: 58000.00, ingreso_diario: 2235.00, num_tareas_diarias: 100, comision_por_tarea: 22.35, orden: 6, activo: true },
  { id: 'l8', codigo: 'GLOBAL 7', nombre: 'GLOBAL 7', deposito: 124000.00, ingreso_diario: 4961.60, num_tareas_diarias: 160, comision_por_tarea: 31.01, orden: 7, activo: true },
  { id: 'l9', codigo: 'GLOBAL 8', nombre: 'GLOBAL 8', deposito: 299400.00, ingreso_diario: 11977.50, num_tareas_diarias: 250, comision_por_tarea: 47.91, orden: 8, activo: true },
  { id: 'l10', codigo: 'GLOBAL 9', nombre: 'GLOBAL 9', deposito: 541600.00, ingreso_diario: 23548.00, num_tareas_diarias: 400, comision_por_tarea: 58.87, orden: 9, activo: true },
];

export async function initStore() {
  const hash = await bcrypt.hash('123456', 10);
  const hashFondo = await bcrypt.hash('123456', 10);

  const adminId = uuidv4();
  const user1Id = uuidv4();

  const admin = {
    id: adminId,
    telefono: '+59170000000',
    nombre_usuario: 'admin',
    nombre_real: 'Administrador',
    password_hash: await bcrypt.hash('admin123', 10),
    password_fondo_hash: hashFondo,
    codigo_invitacion: 'ADMIN001',
    nivel_id: 'l2', // S1
    rol: 'admin',
    saldo_principal: 0,
    saldo_comisiones: 0,
    bloqueado: false,
  };

  const user1 = {
    id: user1Id,
    telefono: '+59174344916',
    nombre_usuario: 'alexj',
    nombre_real: 'Alexander Jimenez',
    password_hash: hash,
    password_fondo_hash: hashFondo,
    codigo_invitacion: 'VUSBV2GTX',
    invitado_por: null,
    nivel_id: 'l1', // pasante
    saldo_principal: 14.40,
    saldo_comisiones: 28.80,
    rol: 'usuario',
    bloqueado: false,
  };

  // Generamos tareas limpias con nombres reales de marcas y URLs de video
  const tasks = [
    // Tareas Pasante
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Adidas Global', recompensa: 1.80, video_url: '/video/adidas1.mp4', descripcion: 'Nueva campaña Adidas 2026', pregunta: '¿Qué marca viste?', respuesta_correcta: 'ADIDAS', opciones: ['ADIDAS', 'NIKE', 'PUMA', 'REEBOK'] },
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Coca-Cola Summer', recompensa: 1.80, video_url: '/video/cocacola1.mp4', descripcion: 'Refrescante sabor Coca-Cola', pregunta: '¿Qué marca viste?', respuesta_correcta: 'COCACOLA', opciones: ['COCACOLA', 'PEPSI', 'SPRITE', 'FANTA'] },
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Chanel Classic', recompensa: 1.80, video_url: '/video/chanel1.mp4', descripcion: 'Elegancia atemporal Chanel', pregunta: '¿Qué marca viste?', respuesta_correcta: 'CHANEL', opciones: ['CHANEL', 'DIOR', 'GUCCI', 'PRADA'] },
    { id: uuidv4(), nivel_id: 'pasante', nombre: 'Dior Fashion', recompensa: 1.80, video_url: '/video/dior1.mp4', descripcion: 'Alta costura con Dior', pregunta: '¿Qué marca viste?', respuesta_correcta: 'DIOR', opciones: ['DIOR', 'CHANEL', 'HERMES', 'PRADA'] },
    
    // Tareas Global 1
    { id: uuidv4(), nivel_id: 'Global 1', nombre: 'Nike Air Max', recompensa: 1.80, video_url: '/video/nike1.mp4', descripcion: 'Innovación en cada paso', pregunta: '¿Qué marca viste?', respuesta_correcta: 'NIKE', opciones: ['NIKE', 'ADIDAS', 'PUMA', 'REEBOK'] },
    { id: uuidv4(), nivel_id: 'Global 1', nombre: 'Puma Speed', recompensa: 1.80, video_url: '/video/puma1.mp4', descripcion: 'Diseño y velocidad Puma', pregunta: '¿Qué marca viste?', respuesta_correcta: 'PUMA', opciones: ['PUMA', 'NIKE', 'ADIDAS', 'REEBOK'] },
    { id: uuidv4(), nivel_id: 'Global 1', nombre: 'Rolex Luxury', recompensa: 1.80, video_url: '/video/rolex1.mp4', descripcion: 'Precisión y prestigio Rolex', pregunta: '¿Qué marca viste?', respuesta_correcta: 'ROLEX', opciones: ['ROLEX', 'OMEGA', 'CASIO', 'CARTIER'] },
    { id: uuidv4(), nivel_id: 'Global 1', nombre: 'Ferrari F8', recompensa: 1.80, video_url: '/video/lamborghini1.mp4', descripcion: 'Potencia pura en pista', pregunta: '¿Qué marca viste?', respuesta_correcta: 'LAMBORGHINI', opciones: ['LAMBORGHINI', 'FERRARI', 'PORSCHE', 'MCLAREN'] },
  ];

  const banners = [
    { id: uuidv4(), imagen_url: '/imag/carrusel1.jpeg', titulo: 'Bienvenido', orden: 0, activo: true },
    { id: uuidv4(), imagen_url: '/imag/carrusel2.jpeg', titulo: 'Gana Diariamente', orden: 1, activo: true },
  ];

  const metodosQr = [
    { id: uuidv4(), nombre_titular: 'Global Oficial', imagen_qr_url: '', imagen_base64: null, activo: true, orden: 0 },
  ];

  const mensajesGlobales = [
    { 
      id: uuidv4(), 
      titulo: 'Bienvenida a BCB Global v7.0.0', 
      contenido: 'Estamos emocionados de lanzar nuestra nueva plataforma institucional con sede en Colorado, USA. Disfruta de una experiencia premium y segura.', 
      imagen_url: '/imag/noticia1.jpeg',
      fecha: new Date().toISOString() 
    },
    { 
      id: uuidv4(), 
      titulo: 'Nuevo Sistema de Retiros', 
      contenido: 'Recuerda que los retiros ahora se procesan según tu nivel Global: Martes (G1), Miércoles (G2), Jueves (G3), Viernes (G4), Sábado y Domingo (G5+).', 
      imagen_url: null,
      fecha: new Date(Date.now() - 86400000).toISOString() 
    }
  ];

  return {
    users: [admin, user1],
    levels,
    tasks,
    metodosQr,
    banners,
    mensajesGlobales,
    tarjetas: [],
    retiros: [],
    recargas: [],
    transacciones: [],
    notificaciones: [
      { id: uuidv4(), usuario_id: user1Id, titulo: 'Bienvenido', mensaje: '¡Bienvenido a la nueva plataforma Global!', leida: false },
    ],
    publicContent: {
      home_guide: 'Liderando el futuro publicitario.',
      popup_title: 'Actualización Global',
      popup_message: 'Hemos mejorado el sistema de tareas para tu comodidad.',
      popup_enabled: true,
      conferencia_title: 'Próximos eventos',
      conferencia_noticias: '• Reunión informativa todos los sábados.',
      horario_recarga: { enabled: false, dias_semana: [1, 2, 3, 4, 5, 6, 0], hora_inicio: '09:00', hora_fin: '18:00' },
      horario_retiro: { enabled: false, dias_semana: [1, 2, 3, 4, 5, 6, 0], hora_inicio: '09:00', hora_fin: '18:00' },
    },
  };
}
