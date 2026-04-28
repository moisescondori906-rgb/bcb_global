import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Configuración de Multer para almacenamiento local
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folder = req.query.folder || 'videos';
    const targetDir = path.join(UPLOADS_DIR, folder);
    try {
      await fs.mkdir(targetDir, { recursive: true });
      cb(null, targetDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const localUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB para videos
  }
});

/**
 * Guarda una imagen desde un buffer en el almacenamiento local.
 * @param {Buffer} buffer - El buffer de la imagen.
 * @param {Object} options - Opciones (folder, filename).
 * @returns {Promise<Object>} - Resultado con la URL segura.
 */
export const saveImageLocal = async (buffer, options = {}) => {
  const folder = options.folder || 'imagenes';
  const targetDir = path.join(UPLOADS_DIR, folder);
  
  // Asegurar que el directorio existe
  await fs.mkdir(targetDir, { recursive: true });
  
  const filename = options.filename || `${uuidv4()}.jpg`;
  const filePath = path.join(targetDir, filename);
  
  await fs.writeFile(filePath, buffer);
  
  // Retornar un objeto compatible con lo que esperaba de Cloudinary
  const publicPath = `/uploads/${folder}/${filename}`;
  return {
    secure_url: publicPath,
    public_id: filename
  };
};

/**
 * Guarda un archivo desde base64.
 * @param {string} base64String - La cadena base64.
 * @param {Object} options - Opciones (folder).
 * @returns {Promise<Object>}
 */
export const saveBase64ImageLocal = async (base64String, options = {}) => {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  return saveImageLocal(buffer, options);
};

/**
 * Elimina un archivo del almacenamiento local.
 * @param {string} publicPath - La ruta relativa del archivo.
 */
export const deleteLocalFile = async (publicPath) => {
  if (!publicPath) return;
  const filePath = path.join(process.cwd(), 'public', publicPath);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error(`Error al eliminar archivo local: ${filePath}`, err.message);
  }
};
