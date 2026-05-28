import { setupAdminBot, sendToSecretaria, setupRetirosBot } from '../services/telegramBot.mjs';
import { safeTelegramCall, safeAsync } from '../utils/safe.mjs';
import { query, queryOne, transaction } from '../config/db.mjs';
import { 
  peruTime, 
  approveLevelPurchase, 
  approveRetiro, 
  rejectRetiro,
  getRetiroById,
  getRecargaById,
  getLevels,
  findUserById,
  distributeInvestmentCommissions,
  getDailyWithdrawalSummary,
  getDailyOperatorSummary
} from '../services/dbService.mjs';
import { checkIdempotencyRedis, acquireLock, releaseLock } from './redisService.mjs';
import logger from '../utils/logger.mjs';
import { CronJob } from 'cron';

/**
 * Genera y envía el reporte detallado por operadores a Telegram
 */
async function sendDailyOperatorReport(bot, chatId) {
  try {
    const data = await getDailyOperatorSummary();
    const dateStr = peruTime.todayStr();
    const t = data.totales;

    let message = `📊 <b>RESUMEN DIARIO DE OPERADORES</b>\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `📅 <b>Fecha:</b> ${dateStr}\n` +
                  `🔁 <b>Recargas procesadas:</b> ${t.recargas_procesadas}\n` +
                  `💵 <b>Total recargas:</b> ${t.total_recargas} Bs\n` +
                  `🏧 <b>Retiros procesados:</b> ${t.retiros_procesados}\n` +
                  `💵 <b>Total retiros solicitados:</b> ${t.total_retiros_solicitados} Bs\n` +
                  `✅ <b>Neto pagado retiros:</b> ${t.total_neto_pagado} Bs\n` +
                  `📉 <b>Descuento total 15%:</b> ${t.total_descuento_15} Bs\n` +
                  `👨‍💼 <b>Comisión operadores 5%:</b> ${t.total_comision_operadores_5} Bs\n` +
                  `🏦 <b>Comisión plataforma 10%:</b> ${t.total_comision_plataforma_10} Bs\n` +
                  `━━━━━━━━━━━━━━━━━━\n\n` +
                  `👥 <b>DETALLE POR OPERADOR</b>\n` +
                  `━━━━━━━━━━━━━━━━━━\n`;

    if (data.operadores.length === 0) {
      message += `<i>No hubo actividad de operadores hoy.</i>`;
    } else {
      data.operadores.forEach(op => {
        const username = op.username ? ` (@${op.username})` : '';
        message += `👨‍💼 <b>Operador:</b> ${op.nombre}${username}\n` +
                   `🆔 <b>Registro:</b> <code>${op.telegram_id}</code>\n` +
                   `🔁 <b>Recargas tomadas:</b> ${op.recargas_tomadas}\n` +
                   `💵 <b>Total recargas:</b> ${op.total_recargas} Bs\n` +
                   `🏧 <b>Retiros tomados:</b> ${op.retiros_tomados}\n` +
                   `💵 <b>Total retiros:</b> ${op.total_retiros} Bs\n` +
                   `✅ <b>Neto pagado:</b> ${op.neto_pagado} Bs\n` +
                   `💰 <b>Comisión retiros 5%:</b> ${op.comision_5} Bs\n` +
                   `━━━━━━━━━━━━━━━━━━\n`;
      });
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    logger.error(`[TELEGRAM-REPORT-OP] Error: ${err.message}`);
  }
}

/**
 * Helper para ocultar teléfono: +591******12345
 */
function maskPhone(phone) {
  const raw = String(phone || '');
  const digits = raw.replace(/\D/g, '');
  const last5 = digits.slice(-5);

  if (!last5) return 'Sin número';

  if (digits.startsWith('591')) {
    return `+591******${last5}`;
  }

  return `******${last5}`;
}

/**
 * Lógica Central de Telegram v10.0.0: ARQUITECTURA DE SERVICIOS UNIFICADA.
 * Ahora utiliza las funciones de dbService para garantizar consistencia y auditoría.
 */
export async function setupTelegramLogic() {
  const bot = await setupAdminBot();
  const botRet = await setupRetirosBot();
  
  if (!bot) return;

  logger.info('[TELEGRAM] Cargando Lógica de Eventos Resiliente v10.0.0...');

  // Función para registrar los listeners en un bot
  const registerBotListeners = (botInstance, botName) => {
    if (!botInstance) return;

    botInstance.on('callback_query', async (callbackQuery) => {
    const { data, message, from, id: callbackId } = callbackQuery;
    if (!data || !from) return;

    logger.info(`[TELEGRAM-DEBUG] Callback recibido (${botName}): data=${data}, fromId=${from.id}, username=${from.username}`);

    // 0. BLINDAJE DE SECRETARIA v10.7.0
    const targetSecretariaId = process.env.TELEGRAM_CHAT_SECRETARIA || '-1003900884989';
    if (String(message.chat.id) === targetSecretariaId) {
      return safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { 
        text: '⚠️ Acciones deshabilitadas en este grupo. Use los grupos operativos.', 
        show_alert: true 
      }), 'answerCallbackQuery-secretariaBlock');
    }

    // Formato esperado v9.5.0+: accion:tipo:refId (ej: tomar:retiro:uuid)
    // Soporte v8.0.0 (Fallback): accion_tipo_refId
    let action, type, refId;
    if (data.includes(':')) {
      [action, type, refId] = data.split(':');
    } else if (data.includes('_')) {
      const parts = data.split('_');
      // Mapeo manual para compatibilidad con botones antiguos
      if (parts[0] === 'retiro' || parts[0] === 'recarga') {
        type = parts[0];
        action = parts[1] === 'pagar' || parts[1] === 'aprobar' ? 'aceptar' : parts[1];
        refId = parts.slice(2).join('_');
      } else {
        [action, type, refId] = parts;
      }
    }

    if (!action || !refId) {
      logger.warn(`[TELEGRAM] Callback data malformado: ${data}`);
      return safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { 
        text: '⚠️ Este botón pertenece a una versión antigua y ya no es válido.', 
        show_alert: true 
      }), 'answerCallbackQuery-malformed');
    }

    const telegramUserId = String(from.id);
    const telegramUsername = from.username || 'User_' + telegramUserId.substring(0, 5);

    // 1. IDEMPOTENCIA (Redis)
    const isProcessed = await checkIdempotencyRedis(callbackId);
    if (isProcessed) {
      return safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { text: '⚠️ Acción ya procesada.' }), 'answerCallback-Idempotency');
    }

    try {
      // 2. IDENTIFICACIÓN DE ADMINISTRADOR (Abierto v10.4.0)
      logger.info(`[TELEGRAM-DEBUG] Identificando admin: telegramUserId=${telegramUserId}, username=${from.username}`);
      // Buscamos si el usuario de Telegram está vinculado a un admin web
      let webAdmin = await queryOne(`
        SELECT id, nombre_usuario as nombre 
        FROM usuarios 
        WHERE (telegram_user_id = ? OR telegram_user_id = ? OR telegram_username = ?) AND rol = 'admin'
      `, [telegramUserId, from.id, from.username]);

      // Si no está vinculado, permitimos el acceso pero usamos un Admin de la DB para auditoría
      if (!webAdmin) {
        logger.info(`[TELEGRAM-DEBUG] Admin no vinculado, buscando admin fallback...`);
        // Intentamos buscar cualquier admin activo para que la auditoría no falle
        webAdmin = await queryOne(`SELECT id, nombre_usuario as nombre FROM usuarios WHERE rol = 'admin' LIMIT 1`);
        
        // Si no hay NINGÚN admin en la DB (raro), usamos un ID genérico o fallamos con gracia
        if (!webAdmin) {
          logger.error('[TELEGRAM] No se encontró ningún administrador en la tabla usuarios.');
          return safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { 
            text: '❌ Error crítico: No hay administradores configurados en el sistema.', 
            show_alert: true 
          }), 'answerCallbackQuery-NoAdmins');
        }

        // Usamos el nombre de Telegram del operador para el registro visual
        webAdmin.nombre = telegramUsername;
        logger.info(`[TELEGRAM-AUTH] Operador externo detectado: ${telegramUsername} (${telegramUserId}). Usando Admin ID: ${webAdmin.id} para auditoría.`);
      }

      const adminId = webAdmin.id;
      const adminName = webAdmin.nombre;
      logger.info(`[TELEGRAM-DEBUG] Admin identificado: id=${adminId}, nombre=${adminName}`);

      // 3. LOCK DISTRIBUIDO (Redlock)
      const lock = await acquireLock(`telegram:${refId}`, 15000);
      if (!lock) {
        return safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { text: '⏳ Procesando en otra instancia, espera...' }), 'answerCallback-Lock');
      }

      try {
        // 4. TRANSACCIÓN ATÓMICA CON BLOQUEO DE FILA
        logger.info(`[TELEGRAM-DEBUG] Iniciando transacción para refId: ${refId}, acción: ${action}`);
        await transaction(async (conn) => {
          // 1. Obtener estado del caso
          const [casoRows] = await conn.query(
            `SELECT * FROM telegram_casos_bloqueo WHERE referencia_id = ? FOR UPDATE`,
            [refId]
          );
          let caso = casoRows[0];

          if (!caso) {
            // Intentar detectar tipo si no viene explícito
            let opType = type;
            if (!opType) {
              if (data.includes('retiro')) {
                opType = 'retiro';
              } else if (data.includes('recarga')) {
                opType = 'recarga';
              } else {
                // Búsqueda exhaustiva si falla el data
                const [isRetiro] = await conn.query('SELECT id FROM retiros WHERE id = ?', [refId]);
                opType = isRetiro.length > 0 ? 'retiro' : 'recarga';
              }
            }

            logger.info(`[TELEGRAM-DEBUG] Creando registro de bloqueo para refId: ${refId}, tipo: ${opType}`);
            try {
              await conn.query(
                'INSERT INTO telegram_casos_bloqueo (referencia_id, tipo_operacion, estado_operativo) VALUES (?, ?, "pendiente")',
                [refId, opType]
              );
            } catch (insErr) {
              if (insErr.code !== 'ER_DUP_ENTRY') throw insErr;
              logger.info(`[TELEGRAM-DEBUG] Registro de bloqueo ya existía (carrera), continuando...`);
            }
            const [retryRows] = await conn.query('SELECT * FROM telegram_casos_bloqueo WHERE referencia_id = ? FOR UPDATE', [refId]);
            caso = retryRows[0];
          }

          const opType = caso.tipo_operacion;

          if (action === 'tomar') {
            // 1. Verificación de Bloqueo Atómico
            if (caso.estado_operativo === 'tomado' || caso.estado_operativo === 'resuelto') {
              const tomadoPor = caso.tomado_por_username ? `@${caso.tomado_por_username}` : (caso.tomado_por_nombre || 'otro operador');
              return safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { 
                text: `❌ Este caso ya fue tomado por ${tomadoPor}.`,
                show_alert: true 
              }), 'answerCallbackQuery-alreadyTaken');
            }

            // 2. Marcar como tomado en bloqueo (atómico)
            logger.info(`[TELEGRAM-DEBUG] Actualizando bloqueo a 'tomado' para ${refId}`);
            await conn.query(`
              UPDATE telegram_casos_bloqueo 
              SET estado_operativo = 'tomado', 
                  tomado_por = ?, 
                  tomado_por_nombre = ?,
                  tomado_por_username = ?,
                  tomado_at = ?, 
                  telegram_message_id = ?,
                  chat_id = ?,
                  operador_telegram_id = ?,
                  operador_nombre = ?,
                  operador_username = ?
              WHERE referencia_id = ?
            `, [
              telegramUserId, 
              adminName,
              from.username || null,
              peruTime.now(), 
              String(message.message_id), 
              String(message.chat.id),
              telegramUserId,
              adminName,
              from.username || null,
              refId
            ]);

            // 3. Actualizar estado operativo en la tabla real (retiros o recargas)
            const realOpType = caso.tipo_operacion;
            logger.info(`[TELEGRAM-DEBUG] Actualizando tabla real: ${realOpType} para refId: ${refId}`);
            
            if (realOpType === 'retiro') {
              const [res] = await conn.query(`
                UPDATE retiros 
                SET estado_operativo = 'tomado', 
                    operador_telegram_id = ?, 
                    operador_nombre = ?, 
                    operador_username = ?, 
                    tomado_en = ? 
                WHERE id = ?
                  AND (estado_operativo IS NULL OR estado_operativo = 'pendiente')
              `, [telegramUserId, adminName, from.username || null, peruTime.now(), refId]);
              logger.info(`[TELEGRAM-DEBUG] Resultado update retiros: ${res.affectedRows} filas.`);
              if (res.affectedRows === 0) {
                throw new Error(`Este caso ya fue tomado por otro operador o no está pendiente.`);
              }
            } else {
              const [res] = await conn.query(`
                UPDATE compras_nivel 
                SET estado_operativo = 'tomado',
                    operador_telegram_id = ?,
                    operador_nombre = ?,
                    operador_username = ?,
                    tomado_en = ?
                WHERE id = ?
                  AND (estado_operativo IS NULL OR estado_operativo = 'pendiente')
              `, [telegramUserId, adminName, from.username || null, peruTime.now(), refId]);
              logger.info(`[TELEGRAM-DEBUG] Resultado update compras_nivel: ${res.affectedRows} filas.`);
              if (res.affectedRows === 0) {
                throw new Error(`Este caso ya fue tomado por otro operador o no está pendiente.`);
              }
            }

            const displayerName = from.username ? `@${from.username}` : (from.first_name || 'Operador');
            logger.info(`[TELEGRAM-DEBUG] Caso tomado exitosamente por ${displayerName}`);
            await safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { text: `✅ Caso tomado correctamente.` }), 'answerCallbackQuery-tomar-success');
            await updateTelegramMessage(botInstance, message, 'tomado', displayerName, refId, realOpType, telegramUserId);

            // Notificar al otro grupo v12.1.0
            if (realOpType === 'retiro') {
              const botAdmin = await setupAdminBot();
              const botRetiros = await setupRetirosBot();
              const retirosChatId = process.env.TELEGRAM_CHAT_RETIROS;
              const adminChatId = process.env.TELEGRAM_CHAT_ADMIN;
              
              logger.info(`[TELEGRAM-DEBUG] Notificación cruzada: msgChat=${message.chat.id}, adminChat=${adminChatId}, retirosChat=${retirosChatId}`);

              // 1. Si fue tomado en el grupo ADMIN, avisar en el de RETIROS
              if (String(message.chat.id) === adminChatId && botRetiros && retirosChatId) {
                await botRetiros.sendMessage(retirosChatId, `✍️ <b>Caso Tomado</b>\nEl retiro <code>${refId.substring(0,8)}</code> ha sido tomado por el administrador <b>${displayerName}</b> en el panel central.`, { parse_mode: 'HTML' });
              }
              // 2. Si fue tomado en el grupo RETIROS, avisar en el de ADMIN (para sincronizar botones si el bot es distinto)
              else if (String(message.chat.id) === retirosChatId && botAdmin && adminChatId) {
                await botAdmin.sendMessage(adminChatId, `✍️ <b>Caso Tomado</b>\nEl retiro <code>${refId.substring(0,8)}</code> ha sido tomado directamente en el grupo de retiros por <b>${displayerName}</b>.`, { parse_mode: 'HTML' });
              }
            }
          }

          else if (action === 'aceptar' || action === 'rechazar') {
            // Permitir aceptar/rechazar incluso si el estado operativo en telegram_casos_bloqueo no es 'tomado'
            // pero el registro existe. Esto soluciona casos donde la tabla real se actualizó pero la de bloqueo no.
            if (caso.estado_operativo === 'resuelto') {
              throw new Error('Este caso ya ha sido resuelto.');
            }
            
            const isAceptar = action === 'aceptar';

            if (opType === 'retiro') {
              if (isAceptar) {
                await approveRetiro(refId, adminId);
              } else {
                await rejectRetiro(refId, adminId, 'Rechazado desde Telegram');
              }
            } else {
              if (isAceptar) {
                // VALIDACIÓN DE JERARQUÍA ANTES DE APROBAR EN TELEGRAM
                const levels = await getLevels();
                const compra = await getRecargaById(refId);
                if (!compra) throw new Error('Orden de recarga no encontrada.');

                const targetLevel = levels.find(l => l.id === compra.nivel_id);
                const [userRows] = await conn.query('SELECT * FROM usuarios WHERE id = ?', [compra.usuario_id]);
                const user = userRows[0];
                const currentLevel = levels.find(l => l.id === user.nivel_id);

                if (currentLevel && targetLevel && targetLevel.orden < currentLevel.orden) {
                  throw new Error(`No se puede bajar de nivel. El usuario ya es ${currentLevel.nombre}.`);
                }

                await approveLevelPurchase(refId, adminId);
                // Notificar comisiones (async)
                if (compra) distributeInvestmentCommissions(compra.usuario_id, compra.monto);
              } else {
                await conn.query(
                  `UPDATE compras_nivel SET estado = 'rechazada', procesado_por = ?, procesado_at = NOW() WHERE id = ?`,
                  [adminId, refId]
                );
              }
            }

            // Marcar como resuelto en bloqueo y en la tabla real
            await conn.query(
              `UPDATE telegram_casos_bloqueo SET estado_operativo = 'resuelto', resuelto_at = ? WHERE referencia_id = ?`,
              [peruTime.now(), refId]
            );

            const table = opType === 'retiro' ? 'retiros' : 'compras_nivel';
            await conn.query(
              `UPDATE ${table} SET estado_operativo = ? WHERE id = ?`,
              [isAceptar ? 'aceptado' : 'rechazado', refId]
            );

            await safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { text: `✅ Caso ${action}do correctamente.` }), 'answerCallbackQuery-resolver');
            await updateTelegramMessage(botInstance, message, 'resuelto', adminName, refId, opType, telegramUserId, action);

            // 5. NOTIFICAR A SECRETARÍA v10.7.0 (Solo si es Aceptado)
            if (isAceptar) {
              const resText = opType === 'retiro' ? 'RETIRO PAGADO' : 'RECARGA COMPLETADA';
              let userInfo = '';
              
              if (opType === 'recarga' || opType === 'retiro') {
                const table = opType === 'retiro' ? 'retiros' : 'compras_nivel';
                const [dataRows] = await conn.query(`
                  SELECT u.telefono, u.nombre_real, r.monto
                  FROM ${table} r
                  LEFT JOIN usuarios u ON u.id = r.usuario_id
                  WHERE r.id = ?
                `, [refId]);
                const data = dataRows[0];

                if (data) {
                  const masked = maskPhone(data.telefono);
                  userInfo = `📱 <b>Usuario:</b> <code>${masked}</code>\n` +
                             `👤 <b>Nombre:</b> ${data.nombre_real || 'No especificado'}\n` +
                             `💵 <b>Monto:</b> ${data.monto} Bs\n`;
                }
              }

              const secMsg = `<b>✅ ${resText}</b>\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `👤 <b>Operador:</b> ${adminName}\n` +
                            userInfo +
                            `🆔 <b>Ref:</b> <code>${refId.substring(0, 8)}</code>\n` +
                            `🕒 <b>Finalizado:</b> ${peruTime.getTimeString()}\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `<i>El caso ha sido procesado exitosamente.</i>`;
              
              sendToSecretaria(secMsg);
            }
          }
        });
      } finally {
        await releaseLock(lock);
      }

    } catch (err) {
      logger.error(`[Telegram Callback Error]: ${err.message}`, { 
        stack: err.stack,
        data,
        fromId: from.id,
        username: from.username
      });
      safeTelegramCall(() => botInstance.answerCallbackQuery(callbackId, { 
        text: `❌ ERROR: ${err.message}`, 
        show_alert: true 
      }), 'answerCallbackQuery-error');
    }
    });
  };

  // --- REPORTES AUTOMÁTICOS (Cron) ---
  const secretariaChatId = process.env.TELEGRAM_CHAT_SECRETARIA || '-1003900884989';
  
  // Tarea programada: 22:00 Hora Bolivia
  new CronJob('0 22 * * *', () => {
    logger.info('[CRON] Enviando reporte diario de operadores (22:00 Bolivia)...');
    sendDailyOperatorReport(bot, secretariaChatId);
  }, null, true, 'America/La_Paz');

  // --- COMANDOS MANUALES ---
  bot.onText(/\/resumen_operadores/, async (msg) => {
    const chatId = msg.chat.id;
    sendDailyOperatorReport(bot, chatId);
  });

  bot.onText(/\/resumen_retiros/, async (msg) => {
    const chatId = msg.chat.id;
    sendDailyOperatorReport(bot, chatId);
  });

  // --- REGISTRAR LISTENERS EN AMBOS BOTS ---
  registerBotListeners(bot, 'AdminBot');
  registerBotListeners(botRet, 'RetirosBot');
}

async function updateTelegramMessage(bot, message, estado, operador, refId, tipo, operadorId = '', resolucion = '') {
  const chatId = message.chat.id;
  const messageId = message.message_id;
  const oldText = message.caption || message.text || '';

  logger.info(`[TELEGRAM-DEBUG] Actualizando mensaje ${messageId} a estado ${estado}`);

  // Limpiar texto anterior de estado de forma segura (conservar el mensaje original v12.1.0)
  // Buscamos el separador de estado si existe, si no usamos el texto completo
  let baseText = oldText;
  if (baseText.includes('\n\n---')) {
    baseText = baseText.split('\n\n---')[0];
  }

  let newText = baseText;
  let buttons = [];

  if (estado === 'tomado') {
    const actionLabel = tipo === 'retiro' ? 'Aceptar/Pagar' : 'Aceptar/Activar';
    newText += `\n\n--- ⏳ EN PROCESO ---\n👨‍💼 Operador: ${operador}\n🆔 Registro Telegram: ${operadorId}\n🕒 Tomado a las: ${peruTime.getTimeString()}`;
    buttons = [
      [
        { text: `✅ ${actionLabel}`, callback_data: `aceptar:${tipo}:${refId}` },
        { text: '❌ Rechazar', callback_data: `rechazar:${tipo}:${refId}` }
      ]
    ];
  } else if (estado === 'resuelto') {
    const emoji = resolucion === 'aceptar' ? '✅' : '❌';
    const actionLabel = resolucion === 'aceptar' ? (tipo === 'retiro' ? 'PAGADO' : 'APROBADO') : 'RECHAZADO';
    newText += `\n\n--- ${emoji} ${actionLabel} ---\n👨‍💼 Por: ${operador}\n🕒 A las: ${peruTime.getTimeString()}`;
    buttons = []; // Sin botones tras resolver
  }

  await safeTelegramCall(() => {
    if (message.caption) {
      return bot.editMessageCaption(newText, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: buttons }
      });
    } else {
      return bot.editMessageText(newText, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: buttons }
      });
    }
  }, 'editTelegramMessage');
}
