
import { query } from '../src/config/db.mjs';

async function migrate() {
  try {
    console.log('🚀 Iniciando migración para permitir repetición de videos...');
    
    // 1. Eliminar la restricción UNIQUE que impide repetir tareas el mismo día
    try {
      await query('ALTER TABLE actividad_tareas DROP INDEX unique_user_task_day');
      console.log('✅ Restricción unique_user_task_day eliminada con éxito.');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️ La restricción unique_user_task_day ya no existía o ya fue eliminada.');
      } else {
        throw err;
      }
    }

    // 2. Opcional: Asegurar que existan los índices de búsqueda para rendimiento
    await query('CREATE INDEX IF NOT EXISTS idx_actividad_usuario_dia ON actividad_tareas (usuario_id, fecha_dia)');
    console.log('✅ Índice de búsqueda idx_actividad_usuario_dia verificado.');

    console.log('✨ Migración completada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error CRÍTICO en migración:', err);
    process.exit(1);
  }
}

migrate();
