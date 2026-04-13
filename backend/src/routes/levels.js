import { Router } from 'express';
import { getLevels } from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const levels = await getLevels();
  res.json(levels);
});

router.get('/', async (req, res) => {
  try {
    const { getLevels } = await import('../lib/queries.js');
    const levels = await getLevels();
    
    const formatted = levels.map(l => {
      const tareas_diarias = Number(l.num_tareas_diarias || 0);
      const ganancia_tarea = Number(l.ganancia_tarea || 0);
      const ingreso_diario = Number((tareas_diarias * ganancia_tarea).toFixed(2));
      
      return {
        ...l,
        ingreso_diario,
        ingreso_mensual: Number((ingreso_diario * 30).toFixed(2)),
        ingreso_anual: Number((ingreso_diario * 365).toFixed(2))
      };
    });
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener niveles' });
  }
});

router.get('/ganancias', authenticate, async (req, res) => {
  try {
    const { getLevels } = await import('../lib/queries.js');
    const levels = await getLevels();
    
    const formatted = levels.map(l => {
      const tareas_diarias = Number(l.num_tareas_diarias || 0);
      const ganancia_tarea = Number(l.ganancia_tarea || 0);
      const ingreso_diario = Number((tareas_diarias * ganancia_tarea).toFixed(2));
      
      return {
        ...l,
        ingreso_diario,
        ingreso_mensual: Number((ingreso_diario * 30).toFixed(2)),
        ingreso_anual: Number((ingreso_diario * 365).toFixed(2))
      };
    });
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ganancias' });
  }
});

export default router;
