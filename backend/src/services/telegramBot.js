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
 * Escuchador global de Callbacks para control de Retiros
 */
if (botAdmin) {
  botAdmin.on('callback_query', async (query) => {
    const { data, message, from } = query;
    const [action, id] = data.split('_');
    const operatorId = from.id;
    const operatorName = from.first_name || from.username || 'Operador';

    try {
      const { transaction, queryOne } = await import('../config/db.js');
      
      // 1. LÓGICA DE TOMAR
      if (action === 'tomar') {
        const result = await transaction(async (conn) => {
          // Bloqueo SELECT FOR UPDATE para evitar race condition
          const [retiro] = await conn.query(`SELECT * FROM retiros WHERE id = ? FOR UPDATE`, [id]);
          
          if (!retiro[0]) throw new Error("Retiro no encontrado");
          if (retiro[0].estado_operativo !== 'pendiente') {
            throw new Error(`⚠️ Ya fue tomado por: ${retiro[0].tomado_por_nombre || 'otro operador'}`);
          }

          await conn.query(`UPDATE retiros SET estado_operativo = 'tomado', tomado_por = ?, fecha_toma = NOW(), tomado_por_nombre = ? WHERE id = ?`, 
            [operatorId, operatorName, id]);
          
          return retiro[0];
        });

        console.log(`Retiro ${id} tomado por ${operatorName}`);
        
        // Sincronizar mensaje en los otros grupos (Retiros y Secretaria)
        const syncText = `${message.text}\n\n🔒 <b>Tomado por:</b> ${operatorName}`;
        
        // 1. Editar en ADMIN (donde están los botones)
        await botAdmin.editMessageText(syncText, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Aprobar', callback_data: `aprobar_${id}` },
                { text: '❌ Rechazar', callback_data: `rechazar_${id}` }
              ]
            ]
          }
        });

        // 2. Sincronizar con los otros grupos si tenemos los message_ids guardados
        if (botRetiros && result.msg_id_retiros) {
          await botRetiros.editMessageText(syncText, {
            chat_id: process.env.TELEGRAM_CHAT_RETIROS,
            message_id: result.msg_id_retiros,
            parse_mode: 'HTML'
          }).catch(e => console.error("Error sync Retiros:", e.message));
        }

        if (botSecretaria && result.msg_id_secretaria) {
          await botSecretaria.editMessageText(syncText, {
            chat_id: process.env.TELEGRAM_CHAT_SECRETARIA,
            message_id: result.msg_id_secretaria,
            parse_mode: 'HTML'
          }).catch(e => console.error("Error sync Secretaria:", e.message));
        }

        return botAdmin.answerCallbackQuery(query.id, { text: "✅ Retiro tomado correctamente" });
      }

      // 2. LÓGICA DE APROBAR / RECHAZAR
      if (action === 'aprobar' || action === 'rechazar') {
        const newState = action === 'aprobar' ? 'aprobado' : 'rechazado';
        const emoji = action === 'aprobar' ? '✅' : '❌';

        await transaction(async (conn) => {
          const [retiro] = await conn.query(`SELECT * FROM retiros WHERE id = ? FOR UPDATE`, [id]);
          
          if (!retiro[0]) throw new Error("Retiro no encontrado");
          if (retiro[0].tomado_por != operatorId) {
            throw new Error("❌ No autorizado. Solo quien tomó el retiro puede procesarlo.");
          }
          if (retiro[0].estado_operativo !== 'tomado') {
            throw new Error("⚠️ El retiro ya ha sido procesado.");
          }

          await conn.query(`UPDATE retiros SET estado_operativo = ?, procesado_por = ?, fecha_procesado = NOW() WHERE id = ?`, 
            [newState, operatorId, id]);
          
          // Si es aprobado, también actualizamos el estado general del retiro en la tabla
          if (action === 'aprobar') {
            await conn.query(`UPDATE retiros SET estado = 'completado' WHERE id = ?`, [id]);
          } else {
            await conn.query(`UPDATE retiros SET estado = 'rechazado' WHERE id = ?`, [id]);
          }

          return retiro[0];
        });

        console.log(`Retiro ${id} ${newState} por ${operatorName}`);

        const finalSyncText = `${message.text}\n\n${emoji} <b>${newState.toUpperCase()} por:</b> ${operatorName}`;

        // 1. Editar en ADMIN
        await botAdmin.editMessageText(finalSyncText, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML'
        });

        // 2. Sincronizar con los otros grupos
        if (botRetiros && result.msg_id_retiros) {
          await botRetiros.editMessageText(finalSyncText, {
            chat_id: process.env.TELEGRAM_CHAT_RETIROS,
            message_id: result.msg_id_retiros,
            parse_mode: 'HTML'
          }).catch(e => console.error("Error final sync Retiros:", e.message));
        }

        if (botSecretaria && result.msg_id_secretaria) {
          await botSecretaria.editMessageText(finalSyncText, {
            chat_id: process.env.TELEGRAM_CHAT_SECRETARIA,
            message_id: result.msg_id_secretaria,
            parse_mode: 'HTML'
          }).catch(e => console.error("Error final sync Secretaria:", e.message));
        }

        return botAdmin.answerCallbackQuery(query.id, { text: `Retiro ${newState} con éxito` });
      }

    } catch (err) {
      console.error("Callback Error:", err.message);
      return botAdmin.answerCallbackQuery(query.id, { text: err.message, show_alert: true });
    }
  });
}

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
