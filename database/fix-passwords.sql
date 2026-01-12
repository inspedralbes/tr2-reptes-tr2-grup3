-- Update the password hash for all users to the correct hash for 'admin123'
UPDATE users 
SET password_hash = '$2b$10$wQ1hUA6bhG1nzgap6ZR9LOYQ.LevbTZzavfreWMZrZFi3STx0U8ZG' 
WHERE email IN ('admin@enginy.cat', 'coord1@escola1.cat', 'coord2@escola2.cat', 'teacher@enginy.cat');

-- Verify the update
SELECT email, full_name, role, LEFT(password_hash, 30) as hash_preview FROM users;
