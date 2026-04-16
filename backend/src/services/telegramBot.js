import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

// Inicialización de múltiples bots
export const botAdmin = process.env.TELEGRAM_BOT_TOKEN_ADMIN 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_ADMIN, { polling: true }) 
  : null;

export const botRetiros = process.env.TELEGRAM_BOT_TOKEN_RETIROS 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_RETIROS, { polling: true }) 
  : null;

export const botSecretaria = process.env.TELEGRAM_BOT_TOKEN_SECRETARIA 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_SECRETARIA, { polling: true }) 
  : null;

console.log("Sistema Multi-Bot iniciado (Admin, Retiros, Secretaria)");

// Funciones de utilidad mejoradas para multi-bot
export const sendToAdmin = async (message, options = {}) => {
  if (!botAdmin) return false;
  try {
    const opts = { parse_mode: 'HTML', ...options };
    const res = await botAdmin.sendMessage(process.env.TELEGRAM_CHAT_ADMIN, message, opts);
    console.log("✅ Admin: Mensaje enviado");
    return res;
  } catch (e) {
    console.error("❌ Admin Error:", e.message);
    return false;
  }
};

export const sendToRetiros = async (message, options = {}) => {
  if (!botRetiros) return false;
  try {
    const opts = { parse_mode: 'HTML', ...options };
    const res = await botRetiros.sendMessage(process.env.TELEGRAM_CHAT_RETIROS, message, opts);
    console.log("✅ Retiros: Mensaje enviado");
    return res;
  } catch (e) {
    console.error("❌ Retiros Error:", e.message);
    return false;
  }
};

export const sendToSecretaria = async (message, options = {}) => {
  if (!botSecretaria) return false;
  try {
    const opts = { parse_mode: 'HTML', ...options };
    const res = await botSecretaria.sendMessage(process.env.TELEGRAM_CHAT_SECRETARIA, message, opts);
    console.log("✅ Secretaria: Mensaje enviado");
    return res;
  } catch (e) {
    console.error("❌ Secretaria Error:", e.message);
    return false;
  }
};

/**
 * Escuchador global de Callbacks para los 3 Bots (Admin, Retiros, Secretaria)
 */
[botAdmin, botRetiros, botSecretaria].forEach(bot => {
  if (!bot) return;

  bot.on('callback_query', async (query) => {
    try {
      // 1. Validaciones iniciales
      if (!query || !query.data || !query.message) {
        return query.answer();
      }

      const { data, message, from } = query;
      const [accion, id] = data.split('_');

      if (!id || isNaN(id)) {
        return query.answer({ text: "❌ ID inválido", show_alert: true });
      }

      const userId = from.id;
      const userName = from.first_name || from.username || 'Operador';

      // 2. Importar DB dinámicamente
      const { query: dbQuery, queryOne, transaction } = await import('../config/db.js');

      // --- VALIDACIÓN DE SEGURIDAD AVANZADA (FINTECH) ---
      const userTelegram = await queryOne(
        `SELECT rol, activo, intentos_fallidos FROM usuarios_telegram WHERE telegram_id=?`,
        [userId]
      );

      // A. Registrar actividad y validar existencia
      if (!userTelegram) {
        await dbQuery(
          `INSERT INTO seguridad_logs (telegram_id, accion, resultado, detalles) 
           VALUES (?, 'intento_acceso', 'fallo', 'Usuario no registrado intenta interactuar')`,
          [userId]
        );
        return query.answer({ 
          text: "❌ ACCESO DENEGADO: Tu ID no está autorizado en el sistema central.", 
          show_alert: true 
        });
      }

      // B. Validar bloqueo por intentos fallidos
      if (userTelegram.intentos_fallidos >= 5 || userTelegram.activo === 0) {
        await dbQuery(
          `UPDATE usuarios_telegram SET activo=0 WHERE telegram_id=?`, [userId]
        );
        await dbQuery(
          `INSERT INTO seguridad_logs (telegram_id, accion, resultado, detalles) 
           VALUES (?, 'acceso_bloqueado', 'bloqueo', 'Intento de uso por usuario inactivo o con exceso de fallos')`,
          [userId]
        );
        return query.answer({ 
          text: "🔒 CUENTA BLOQUEADA: Contacta al administrador por seguridad.", 
          show_alert: true 
        });
      }

      // C. Actualizar última actividad
      await dbQuery(`UPDATE usuarios_telegram SET ultima_actividad=NOW() WHERE telegram_id=?`, [userId]);

      const rol = userTelegram.rol;
      console.log(`[TELEGRAM-SEC] Acción: ${accion} | Operador: ${userName} | Rol: ${rol}`);

      // D. Validación de Roles y Turnos
      if (rol === 'secretaria') {
        return query.answer({ text: "⚠️ Solo Lectura: Tu rol no permite interacciones.", show_alert: true });
      }

      // Validación de Turno (Solo para roles operativos)
      const ahora = new Date().toLocaleTimeString('es-BO', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const turno = await queryOne(
        `SELECT id FROM turnos_operadores WHERE telegram_id=? AND activo=1 
         AND (
           (hora_inicio <= hora_fin AND ? BETWEEN hora_inicio AND hora_fin) OR
           (hora_inicio > hora_fin AND (? >= hora_inicio OR ? <= hora_fin))
         )`,
        [userId, ahora, ahora, ahora]
      );

      if (!turno && rol !== 'admin') {
        return query.answer({ 
          text: `⏰ FUERA DE TURNO: No estás en tu horario asignado (${ahora}).`, 
          show_alert: true 
        });
      }

      if (rol === 'retiro' && !['tomar', 'aprobar', 'rechazar'].includes(accion)) {
        return query.answer({ text: "❌ Acción restringida para tu departamento.", show_alert: true });
      }
      // ------------------------------------------------

      // 3. LÓGICA DE TOMAR RETIRO (TRANSACCIONAL & CONCURRENCIA)
      if (accion === 'tomar') {
        try {
          const result = await transaction(async (conn) => {
            // SELECT FOR UPDATE: Bloqueo de fila para evitar que otros lean el estado pendiente simultáneamente
            const [retiro] = await conn.query(
              `SELECT estado_operativo, monto, telefono_usuario FROM retiros WHERE id=? FOR UPDATE`, 
              [id]
            );

            if (!retiro || retiro.estado_operativo !== 'pendiente') {
              return { success: false, message: "⚠️ Este retiro ya fue tomado o procesado." };
            }

            // Realizar la toma atómica
            await conn.query(
              `UPDATE retiros 
               SET estado_operativo='tomado', tomado_por=?, tomado_por_nombre=?, fecha_toma=NOW() 
               WHERE id=?`,
              [userId, userName, id]
            );

            // Snapshot para auditoría
            const snapshot = JSON.stringify(retiro);
            await conn.query(
              `INSERT INTO historial_retiros (retiro_id, accion, usuario_telegram_id, nombre_usuario, metadata) 
               VALUES (?, 'tomar', ?, ?, ?)`,
              [id, userId, userName, snapshot]
            );

            return { success: true };
          });

          if (!result.success) {
            return query.answer({ text: result.message, show_alert: true });
          }
        } catch (err) {
          console.error("Error transaccional (Toma):", err.message);
          return query.answer({ text: "❌ Error de concurrencia, reintenta.", show_alert: true });
        }

        // 4. EDITAR MENSAJE (Sincronización Global)
        const newText = `${message.text}\n\n🔒 <b>Tomado por:</b> ${userName}`;
        
        try {
          await bot.editMessageText(newText, {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Aprobar', callback_data: `aprobar_${id}` },
                { text: '❌ Rechazar', callback_data: `rechazar_${id}` }
              ]]
            }
          });
        } catch (e) {
          console.error("Error editando mensaje (Toma):", e.message);
        }

        // Sincronizar otros grupos
        const retiroSync = await queryOne(`SELECT msg_id_admin, msg_id_retiros, msg_id_secretaria FROM retiros WHERE id=?`, [id]);
        
        const syncGroups = [
          { b: botAdmin, cid: process.env.TELEGRAM_CHAT_ADMIN, mid: retiroSync?.msg_id_admin },
          { b: botRetiros, cid: process.env.TELEGRAM_CHAT_RETIROS, mid: retiroSync?.msg_id_retiros },
          { b: botSecretaria, cid: process.env.TELEGRAM_CHAT_SECRETARIA, mid: retiroSync?.msg_id_secretaria }
        ];

        for (const g of syncGroups) {
          if (g.b && g.mid && g.mid != message.message_id) {
            await g.b.editMessageText(newText, { chat_id: g.cid, message_id: g.mid, parse_mode: 'HTML' }).catch(() => {});
          }
        }

        return query.answer({ text: "✅ Has tomado el retiro" });
      }

      // 5. APROBAR / RECHAZAR (SEGURIDAD TOTAL & TRANSACCIONES)
      if (accion === 'aprobar' || accion === 'rechazar') {
        try {
          const result = await transaction(async (conn) => {
            // SELECT FOR UPDATE para asegurar estado
            const [retiro] = await conn.query(
              `SELECT tomado_por, estado_operativo, monto, telefono_usuario FROM retiros WHERE id=? FOR UPDATE`, 
              [id]
            );

            if (!retiro) return { success: false, message: "❌ Retiro no encontrado." };
            
            // Solo quien lo tomó puede procesar
            if (retiro.tomado_por != userId) {
              // Incrementar intentos fallidos por actividad sospechosa
              await conn.query(`UPDATE usuarios_telegram SET intentos_fallidos = intentos_fallidos + 1 WHERE telegram_id=?`, [userId]);
              return { success: false, message: "❌ NO AUTORIZADO: No eres el responsable de este caso." };
            }

            if (retiro.estado_operativo !== 'tomado') {
              return { success: false, message: "⚠️ Ya procesado." };
            }

            const nuevoEstado = accion === 'aprobar' ? 'aprobado' : 'rechazado';
            const finalStatus = accion === 'aprobar' ? 'completado' : 'rechazado';

            await conn.query(
              `UPDATE retiros 
               SET estado_operativo=?, procesado_por=?, fecha_procesado=NOW(), estado=? 
               WHERE id=?`,
              [nuevoEstado, userId, finalStatus, id]
            );

            // Resetear fallos en acción exitosa
            await conn.query(`UPDATE usuarios_telegram SET intentos_fallidos = 0 WHERE telegram_id=?`, [userId]);

            // Auditoría
            const snapshot = JSON.stringify(retiro);
            await conn.query(
              `INSERT INTO historial_retiros (retiro_id, accion, usuario_telegram_id, nombre_usuario, metadata) 
               VALUES (?, ?, ?, ?, ?)`,
              [id, nuevoEstado, userId, userName, snapshot]
            );

            return { success: true, estado: nuevoEstado };
          });

          if (!result.success) {
            return query.answer({ text: result.message, show_alert: true });
          }

          const emoji = result.estado === 'aprobado' ? '✅' : '❌';
          const finalText = `${message.text}\n\n${emoji} <b>${result.estado.toUpperCase()} por:</b> ${userName}`;

          await bot.editMessageText(finalText, {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML'
          });

          // Sincronizar todos los grupos
          const retiroFinal = await queryOne(`SELECT msg_id_admin, msg_id_retiros, msg_id_secretaria FROM retiros WHERE id=?`, [id]);
          const finalSyncGroups = [
            { b: botAdmin, cid: process.env.TELEGRAM_CHAT_ADMIN, mid: retiroFinal.msg_id_admin },
            { b: botRetiros, cid: process.env.TELEGRAM_CHAT_RETIROS, mid: retiroFinal.msg_id_retiros },
            { b: botSecretaria, cid: process.env.TELEGRAM_CHAT_SECRETARIA, mid: retiroFinal.msg_id_secretaria }
          ];

          for (const g of finalSyncGroups) {
            if (g.b && g.mid && g.mid != message.message_id) {
              await g.b.editMessageText(finalText, { chat_id: g.cid, message_id: g.mid, parse_mode: 'HTML' }).catch(() => {});
            }
          }

          return query.answer({ text: `✅ ${result.estado.toUpperCase()} correctamente` });

        } catch (err) {
          console.error("❌ ERROR TRANSACCIONAL:", err.message);
          return query.answer({ text: "❌ Error interno en la transacción.", show_alert: true });
        }
      }

    } catch (err) {
      console.error("❌ ERROR CALLBACK:", err.message);
      try {
        await query.answer({ text: "❌ Error interno", show_alert: true });
      } catch {}
    }
  });
});

export const formatRetiroMessage = (data) => {
  const { telefono, nivel, monto, hora } = data;
  return `📌 <b>NUEVO RETIRO</b>\n\n👤 Usuario: ${telefono}\n🏅 Nivel: ${nivel}\n💵 Monto: ${monto} Bs\n🕒 Hora: ${hora}`;
};

export const formatRecargaMessage = (data) => {
  const { telefono, nivel, monto } = data;
  return `📌 <b>NUEVA RECARGA</b>\n\n👤 Usuario: ${telefono}\n🏅 Nivel: ${nivel}\n💵 Monto: ${monto} Bs`;
};

// Exportar objeto por defecto para compatibilidad
export default {
  botAdmin,
  botRetiros,
  botSecretaria,
  sendToAdmin,
  sendToRetiros,
  sendToSecretaria,
  formatRetiroMessage,
  formatRecargaMessage
};

/**
 * @section CRON JOBS AUTOMÁTICOS
 */

// 1. Job para liberar retiros expirados (Cada 5 minutos)
// Libera retiros tomados hace más de 10 minutos que no han sido procesados.
setInterval(async () => {
  try {
    const { query: dbQuery, transaction } = await import('../config/db.js');
    
    // Obtener retiros expirados
    const expirados = await dbQuery(
      `SELECT id, msg_id_admin, msg_id_retiros, msg_id_secretaria, tomado_por_nombre 
       FROM retiros 
       WHERE estado_operativo='tomado' AND fecha_toma < NOW() - INTERVAL 10 MINUTE`
    );

    for (const ret of expirados) {
      await transaction(async (conn) => {
        // Liberar el retiro
        await conn.query(
          `UPDATE retiros SET estado_operativo='pendiente', tomado_por=NULL, tomado_por_nombre=NULL, fecha_toma=NULL WHERE id=?`,
          [ret.id]
        );
        
        // Registrar en historial
        await conn.query(
          `INSERT INTO historial_retiros (retiro_id, accion, detalles) 
           VALUES (?, 'liberado_timeout', 'Liberado automáticamente por inactividad del operador')`,
          [ret.id]
        );
      });

      console.log(`[CRON] Retiro ${ret.id} liberado por timeout.`);

      // Notificar en grupos sobre la liberación (Opcional, pero recomendado)
      const alertMsg = `⚠️ <b>RETIRO LIBERADO</b>\nEl caso de ID: ${ret.id} ha sido liberado por inactividad de ${ret.tomado_por_nombre || 'el operador'}. Está disponible nuevamente.`;
      
      const syncGroups = [
        { b: botAdmin, cid: process.env.TELEGRAM_CHAT_ADMIN },
        { b: botRetiros, cid: process.env.TELEGRAM_CHAT_RETIROS },
        { b: botSecretaria, cid: process.env.TELEGRAM_CHAT_SECRETARIA }
      ];

      for (const g of syncGroups) {
        if (g.b && g.cid) {
          await g.b.sendMessage(g.cid, alertMsg, { parse_mode: 'HTML' }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("[CRON-TIMEOUT] Error:", err.message);
  }
}, 5 * 60 * 1000);

// 2. Reporte Diario Automático (23:30 Bolivia)
setInterval(async () => {
  const now = new Date();
  const boliviaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
  
  // Ejecutar solo a las 23:30
  if (boliviaTime.getHours() === 23 && boliviaTime.getMinutes() === 30) {
    try {
      const { query: dbQuery, queryOne } = await import('../config/db.js');
      
      // Estadísticas Generales del Día
      const stats = await queryOne(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado_operativo='aprobado' THEN 1 ELSE 0 END) as aprobados,
          SUM(CASE WHEN estado_operativo='rechazado' THEN 1 ELSE 0 END) as rechazados,
          AVG(TIMESTAMPDIFF(SECOND, fecha_toma, fecha_procesado)) as avg_time
        FROM retiros 
        WHERE DATE(fecha_procesado) = CURDATE() OR DATE(fecha_toma) = CURDATE()
      `);

      // Top Operador
      const topOp = await queryOne(`
        SELECT nombre_usuario, COUNT(*) as cantidad
        FROM historial_retiros
        WHERE accion IN ('aprobado', 'rechazado') AND DATE(fecha) = CURDATE()
        GROUP BY usuario_telegram_id, nombre_usuario
        ORDER BY cantidad DESC LIMIT 1
      `);

      const total = stats?.total || 0;
      const aprobados = stats?.aprobados || 0;
      const rechazados = stats?.rechazados || 0;
      const avgMin = stats?.avg_time ? (stats.avg_time / 60).toFixed(1) : 0;
      const topNombre = topOp?.nombre_usuario || 'N/A';
      const topCant = topOp?.cantidad || 0;

      const reportMsg = `📊 <b>REPORTE DEL DÍA (${boliviaTime.toLocaleDateString()})</b>\n\n` +
        `Total procesados: <b>${total}</b>\n` +
        `✅ Aprobados: ${aprobados}\n` +
        `❌ Rechazados: ${rechazados}\n\n` +
        `🏆 <b>Top Operador:</b>\n${topNombre} - ${topCant} retiros\n\n` +
        `⏱ <b>Tiempo Promedio:</b> ${avgMin} min`;

      await sendToAdmin(reportMsg);
      console.log("[CRON-REPORT] Reporte diario enviado.");
    } catch (err) {
      console.error("[CRON-REPORT] Error:", err.message);
    }
  }
}, 60 * 1000); // Revisar cada minuto
