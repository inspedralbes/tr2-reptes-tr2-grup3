const db = require('../../config/db');

// Map 'centers' logic to 'schools' table

const getAllCenters = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM schools ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting centers:', error);
        res.status(500).json({ message: 'Error getting centers' });
    }
};

const getCenterById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM schools WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Center not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting center:', error);
        res.status(500).json({ message: 'Error getting center' });
    }
};

const createCenter = async (req, res) => {
    try {
        const { name, code } = req.body;
        // Ignoramos campos extra del frontend que no están en DB por ahora (address, city, type)
        const result = await db.query(
            'INSERT INTO schools (name, code) VALUES ($1, $2) RETURNING *',
            [name, code]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating center:', error);
        res.status(500).json({ message: 'Error creating center' });
    }
};

const updateCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code } = req.body;
        const result = await db.query(
            'UPDATE schools SET name = $1, code = $2 WHERE id = $3 RETURNING *',
            [name, code, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Center not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating center:', error);
        res.status(500).json({ message: 'Error updating center' });
    }
};

const deleteCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM schools WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Center not found' });
        }
        res.json({ message: 'Center deleted successfully' });
    } catch (error) {
        console.error('Error deleting center:', error);
        res.status(500).json({ message: 'Error deleting center' });
    }
};

module.exports = {
    getAllCenters,
    getCenterById,
    createCenter,
    updateCenter,
    deleteCenter
};
