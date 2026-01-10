const db = require('../../config/db');

const getAllProviders = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM providers ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting providers:', error);
        res.status(500).json({ message: 'Error getting providers' });
    }
};

const getProviderById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM providers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting provider:', error);
        res.status(500).json({ message: 'Error getting provider' });
    }
};

const createProvider = async (req, res) => {
    try {
        const { name, address, contact_email } = req.body;
        const result = await db.query(
            'INSERT INTO providers (name, address, contact_email) VALUES ($1, $2, $3) RETURNING *',
            [name, address, contact_email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating provider:', error);
        res.status(500).json({ message: 'Error creating provider' });
    }
};

const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, contact_email } = req.body;
        const result = await db.query(
            'UPDATE providers SET name = $1, address = $2, contact_email = $3 WHERE id = $4 RETURNING *',
            [name, address, contact_email, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ message: 'Error updating provider' });
    }
};

const deleteProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM providers WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json({ message: 'Provider deleted successfully' });
    } catch (error) {
        console.error('Error deleting provider:', error);
        res.status(500).json({ message: 'Error deleting provider' });
    }
};

module.exports = {
    getAllProviders,
    getProviderById,
    createProvider,
    updateProvider,
    deleteProvider
};
