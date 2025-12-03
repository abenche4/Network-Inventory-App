// PostgreSQL database operations for Network Device Inventory
// Uses pg Pool for connection management and parameterized queries for security

const { Pool } = require('pg');
require('dotenv').config();

// Configure database connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'network_inventory'
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Get all devices from the database
 * @returns {Promise<Array>} Array of device objects
 */
const getDevices = async () => {
  try {
    const result = await pool.query(
      'SELECT * FROM devices ORDER BY id ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

/**
 * Get a single device by ID
 * @param {number} id - Device ID
 * @returns {Promise<Object|null>} Device object or null if not found
 */
const getDeviceById = async (id) => {
  try {
    const result = await pool.query(
      'SELECT * FROM devices WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching device with id ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new device in the database
 * @param {Object} data - Device data object
 * @param {string} data.hostname - Device hostname (required)
 * @param {string} data.ip_address - IP address (required)
 * @param {string} data.device_type - Device type (required)
 * @param {string} [data.location] - Device location
 * @param {string} [data.status] - Device status (default: 'active')
 * @param {string} [data.notes] - Additional notes
 * @returns {Promise<Object>} Created device object with all fields including id and created_at
 */
const createDevice = async (data) => {
  try {
    const { hostname, ip_address, device_type, location, status, notes } = data;
    
    // Use DEFAULT for status if not provided, and handle NULL for optional fields
    const result = await pool.query(
      `INSERT INTO devices (hostname, ip_address, device_type, location, status, notes)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'active'), $6)
       RETURNING *`,
      [
        hostname,
        ip_address,
        device_type,
        location || null,
        status || 'active',
        notes || null
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating device:', error);
    throw error;
  }
};

/**
 * Update an existing device
 * @param {number} id - Device ID
 * @param {Object} data - Updated device data
 * @returns {Promise<Object|null>} Updated device object or null if not found
 */
const updateDevice = async (id, data) => {
  try {
    const { hostname, ip_address, device_type, location, status, notes } = data;
    
    // Build dynamic UPDATE query based on provided fields
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (hostname !== undefined) {
      fields.push(`hostname = $${paramIndex++}`);
      values.push(hostname);
    }
    if (ip_address !== undefined) {
      fields.push(`ip_address = $${paramIndex++}`);
      values.push(ip_address);
    }
    if (device_type !== undefined) {
      fields.push(`device_type = $${paramIndex++}`);
      values.push(device_type);
    }
    if (location !== undefined) {
      fields.push(`location = $${paramIndex++}`);
      values.push(location);
    }
    if (status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    
    if (fields.length === 0) {
      // No fields to update, just return the existing device
      return await getDeviceById(id);
    }
    
    // Add id as the last parameter
    values.push(id);
    const result = await pool.query(
      `UPDATE devices 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error updating device with id ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a device by ID
 * @param {number} id - Device ID
 * @returns {Promise<Object|null>} Deleted device object or null if not found
 */
const deleteDevice = async (id) => {
  try {
    const result = await pool.query(
      'DELETE FROM devices WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error deleting device with id ${id}:`, error);
    throw error;
  }
};

// Export all database operations
module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  pool // Export pool for graceful shutdown if needed
};
