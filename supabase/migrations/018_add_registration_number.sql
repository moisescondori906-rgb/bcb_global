-- Migration: Add registration number to users
-- Description: Adds a numeric registration ID for easier user searching

ALTER TABLE usuarios ADD COLUMN numero_registro INT AUTO_INCREMENT UNIQUE AFTER id;
