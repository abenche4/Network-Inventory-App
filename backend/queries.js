// PostgreSQL database operations for Network Device Inventory
// Uses pg Pool for connection management and parameterized queries for security

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configure database connection pool using environment variables
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === 'true' ||
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_DATABASE || 'network_inventory'
    };

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Get device type name by id
 */
const getDeviceTypeName = async (id) => {
  if (!id) return null;
  const result = await pool.query(
    'SELECT name FROM device_types WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0]?.name || null;
};

/**
 * Get manufacturer name by id
 */
const getManufacturerName = async (id) => {
  if (!id) return null;
  const result = await pool.query(
    'SELECT name FROM manufacturers WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0]?.name || null;
};

/**
 * Get all devices from the database
 * @returns {Promise<Array>} Array of device objects
 */
const getDevices = async () => {
  try {
    const result = await pool.query(
      `SELECT d.*, 
              u.name AS assigned_to_name, u.email AS assigned_to_email,
              dt.name AS device_type_name,
              m.name AS manufacturer_name
       FROM devices d
       LEFT JOIN users u ON d.assigned_user_id = u.id
       LEFT JOIN device_types dt ON d.device_type_id = dt.id
       LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
       ORDER BY d.id ASC`
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
      `SELECT d.*, 
              u.name AS assigned_to_name, u.email AS assigned_to_email,
              dt.name AS device_type_name,
              m.name AS manufacturer_name
       FROM devices d
       LEFT JOIN users u ON d.assigned_user_id = u.id
       LEFT JOIN device_types dt ON d.device_type_id = dt.id
       LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
       WHERE d.id = $1`,
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
    const {
      hostname,
      ip_address,
      device_type,
      device_type_id,
      manufacturer_id,
      location,
      status,
      notes
    } = data;

    let resolvedType = device_type;
    if (!resolvedType && device_type_id) {
      resolvedType = await getDeviceTypeName(device_type_id);
    }
    
    // Use DEFAULT for status if not provided, and handle NULL for optional fields
    const result = await pool.query(
      `INSERT INTO devices (hostname, ip_address, device_type, device_type_id, manufacturer_id, location, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'), $8)
       RETURNING *`,
      [
        hostname,
        ip_address,
        resolvedType || 'Other',
        device_type_id || null,
        manufacturer_id || null,
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
 * Get the next version number for a device file
 * @param {number} deviceId - Device ID
 * @returns {Promise<number>} Next version number
 */
const getNextFileVersion = async (deviceId) => {
  const result = await pool.query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM device_files WHERE device_id = $1',
    [deviceId]
  );
  return result.rows[0].next_version || 1;
};

/**
 * Add a device file entry
 * @param {Object} data
 * @param {number} data.device_id
 * @param {string} data.filename
 * @param {string} data.storage_path
 * @param {string} [data.content_type]
 * @param {number} [data.file_size]
 * @returns {Promise<Object>} Created file record
 */
const addDeviceFile = async (data) => {
  const { device_id, filename, storage_path, content_type, file_size } = data;
  const version = await getNextFileVersion(device_id);
  const result = await pool.query(
    `INSERT INTO device_files (device_id, filename, storage_path, version, content_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [device_id, filename, storage_path, version, content_type || null, file_size || null]
  );
  return result.rows[0];
};

/**
 * Get device files
 * @param {number} deviceId
 * @returns {Promise<Array>}
 */
const getDeviceFiles = async (deviceId) => {
  const result = await pool.query(
    `SELECT id, device_id, filename, storage_path, version, content_type, file_size, uploaded_at
     FROM device_files
     WHERE device_id = $1
     ORDER BY version DESC, uploaded_at DESC`,
    [deviceId]
  );
  return result.rows;
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
    if (data.device_type_id !== undefined) {
      fields.push(`device_type_id = $${paramIndex++}`);
      values.push(data.device_type_id);
    }
    if (data.manufacturer_id !== undefined) {
      fields.push(`manufacturer_id = $${paramIndex++}`);
      values.push(data.manufacturer_id);
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
    if (data.assigned_user_id !== undefined) {
      fields.push(`assigned_user_id = $${paramIndex++}`);
      values.push(data.assigned_user_id);
    }
    if (data.assigned_at !== undefined) {
      fields.push(`assigned_at = $${paramIndex++}`);
      values.push(data.assigned_at);
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
 * Assign a device to a user
 * @param {number} deviceId
 * @param {number} userId
 * @returns {Promise<Object|null>} Updated device with join fields
 */
const assignDeviceToUser = async (deviceId, userId) => {
  await pool.query(
    `UPDATE devices
     SET assigned_user_id = $1, assigned_at = NOW()
     WHERE id = $2`,
    [userId, deviceId]
  );
  return getDeviceById(deviceId);
};

/**
 * Check in (unassign) a device
 * @param {number} deviceId
 * @returns {Promise<Object|null>} Updated device with join fields
 */
const unassignDevice = async (deviceId) => {
  await pool.query(
    `UPDATE devices
     SET assigned_user_id = NULL, assigned_at = NULL
     WHERE id = $1`,
    [deviceId]
  );
  return getDeviceById(deviceId);
};

/**
 * Add a history entry
 */
const addHistoryEntry = async ({ device_id, action, user_id = null, details = null }) => {
  const result = await pool.query(
    `INSERT INTO device_history (device_id, action, user_id, details)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [device_id, action, user_id, details ? JSON.stringify(details) : null]
  );
  return result.rows[0];
};

/**
 * Get device history
 */
const getDeviceHistory = async (deviceId) => {
  const result = await pool.query(
    `SELECT h.*, u.name AS user_name, u.email AS user_email
     FROM device_history h
     LEFT JOIN users u ON h.user_id = u.id
     WHERE h.device_id = $1
     ORDER BY h.created_at DESC`,
    [deviceId]
  );
  return result.rows;
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

/**
 * Get a user by email (for authentication)
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User record or null
 */
const getUserByEmail = async (email) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, active, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User record or null
 */
const getUserById = async (id) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, active, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by id:', error);
    throw error;
  }
};

/**
 * Get all users (for admin list)
 * @returns {Promise<Array>} Array of user objects
 */
const getUsers = async () => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, active, created_at FROM users ORDER BY id ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Create a user with hashed password
 * @param {Object} data - User data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} [data.role='admin']
 * @param {boolean} [data.active=true]
 * @returns {Promise<Object>} Created user (without password hash)
 */
const createUser = async (data) => {
  try {
    const { name, email, password, role = 'admin', active = true } = data;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, active, created_at`,
      [name, email, passwordHash, role, active]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Ensure a default admin user exists (for demo/login)
 */
const ensureDefaultAdmin = async () => {
  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
  const defaultName = process.env.DEFAULT_ADMIN_NAME || 'Admin User';

  const existing = await getUserByEmail(defaultEmail);
  if (existing) {
    return existing;
  }

  console.log(`Creating default admin user (${defaultEmail}). Please change the password.`);
  return createUser({
    name: defaultName,
    email: defaultEmail,
    password: defaultPassword,
    role: 'admin',
    active: true
  });
};

/**
 * Ensure default device types and manufacturers are present
 */
const ensureDefaultLookups = async () => {
  await pool.query(
    `INSERT INTO device_types (name) VALUES
      ('Router'), ('Switch'), ('Firewall'), ('Server'), ('Access Point'), ('Other')
     ON CONFLICT (name) DO NOTHING`
  );
  await pool.query(
    `INSERT INTO manufacturers (name) VALUES
      ('Cisco'), ('Dell'), ('HP'), ('Juniper'), ('Ubiquiti'), ('Aruba')
     ON CONFLICT (name) DO NOTHING`
  );
};

const getDeviceTypes = async () => {
  const result = await pool.query(
    'SELECT id, name FROM device_types ORDER BY name ASC'
  );
  return result.rows;
};

const getManufacturers = async () => {
  const result = await pool.query(
    'SELECT id, name FROM manufacturers ORDER BY name ASC'
  );
  return result.rows;
};

// Export all database operations
module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getUserByEmail,
  getUserById,
  getUsers,
  createUser,
  ensureDefaultAdmin,
  addDeviceFile,
  getDeviceFiles,
  assignDeviceToUser,
  unassignDevice,
  ensureDefaultLookups,
  getDeviceTypes,
  getManufacturers,
  addHistoryEntry,
  getDeviceHistory,
  pool // Export pool for graceful shutdown if needed
};