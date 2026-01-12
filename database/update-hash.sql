-- Actualizar password hash con escape correcto
UPDATE users 
SET password_hash = E'$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG' 
WHERE email IN ('admin@enginy.cat', 'coord1@escola1.cat', 'coord2@escola2.cat', 'teacher@enginy.cat');

-- Verificar
SELECT email, password_hash FROM users WHERE email = 'admin@enginy.cat';
