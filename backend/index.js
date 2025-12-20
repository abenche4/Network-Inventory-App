// Express.js server for Network Device Inventory API
// Provides RESTful API endpoints for CRUD operations on network devices

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  createUser,
  getUserByEmail,
  getUserById,
  getUsers,
  ensureDefaultAdmin,
  addDeviceFile,
  getDeviceFiles,
  assignDeviceToUser,
  unassignDevice,
  ensureDefaultLookups,
  getDeviceTypes,
  getManufacturers,
  addHistoryEntry,
  getDeviceHistory
} = require('./queries');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
// CORS configuration - allows requests from frontend
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Body parser middleware - parses JSON request bodies
app.use(express.json());

// Session middleware for simple auth
app.use(session({
  name: 'inventory.sid',
  secret: process.env.SESSION_SECRET || 'super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (optional but helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== API ROUTES ====================

/**
 * Simple auth guard middleware
 */
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'You must be logged in'
    });
  }
  next();
};

/**
 * POST /auth/login - Session login
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Persist limited user info in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error in POST /auth/login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/register - Create user and start session
 */
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing fields',
        message: 'Name, email, and password are required'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password must be at least 6 characters'
      });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate email',
        message: 'A user with this email already exists'
      });
    }

    const newUser = await createUser({
      name,
      email,
      password,
      role: 'user',
      active: true
    });

    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    res.status(201).json({
      success: true,
      message: 'User registered',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error in POST /auth/register:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate email',
        message: 'A user with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * GET /auth/me - Current session user
 */
app.get('/auth/me', (req, res) => {
  res.json({
    success: true,
    user: req.session.user || null
  });
});

/**
 * POST /auth/logout - Destroy session
 */
app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true,
      message: 'Logged out'
    });
  });
});

/**
 * GET / - API information endpoint
 * Returns basic API information
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Network Device Inventory API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'API information',
      'GET /devices': 'Get all devices',
      'GET /devices/:id': 'Get device by ID',
      'POST /devices': 'Create new device',
      'PUT /devices/:id': 'Update device',
      'DELETE /devices/:id': 'Delete device'
    }
  });
});

/**
 * GET /users - list users (auth required)
 */
app.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await getUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * Lookup endpoints
 */
app.get('/lookups/device-types', async (req, res) => {
  try {
    const types = await getDeviceTypes();
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error in GET /lookups/device-types:', error);
    res.status(500).json({ success: false, error: 'Failed to load device types' });
  }
});

app.get('/lookups/manufacturers', async (req, res) => {
  try {
    const manufacturers = await getManufacturers();
    res.json({ success: true, data: manufacturers });
  } catch (error) {
    console.error('Error in GET /lookups/manufacturers:', error);
    res.status(500).json({ success: false, error: 'Failed to load manufacturers' });
  }
});

// Multer storage for attachments
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const deviceId = req.params.id || 'device';
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `device-${deviceId}-${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * GET /devices/:id/files - list files for a device
 */
app.get('/devices/:id/files', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid device ID' });
    }
    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const files = await getDeviceFiles(id);
    const withUrls = files.map((f) => ({
      ...f,
      file_url: `${req.protocol}://${req.get('host')}/uploads/${path.basename(f.storage_path)}`
    }));
    res.json({ success: true, data: withUrls });
  } catch (error) {
    console.error('Error in GET /devices/:id/files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch device files', message: error.message });
  }
});

/**
 * POST /devices/:id/files - upload a config/attachment
 */
app.post('/devices/:id/files', upload.single('file'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid device ID' });
    }
    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const record = await addDeviceFile({
      device_id: id,
      filename: req.file.originalname,
      storage_path: req.file.path,
      content_type: req.file.mimetype,
      file_size: req.file.size
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded',
      data: {
        ...record,
        file_url: `${req.protocol}://${req.get('host')}/uploads/${path.basename(record.storage_path)}`
      }
    });
  } catch (error) {
    console.error('Error in POST /devices/:id/files:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file', message: error.message });
  }
});

/**
 * POST /devices/:id/assign - check out a device to a user
 */
app.post('/devices/:id/assign', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { userId } = req.body;
    if (isNaN(id) || !userId) {
      return res.status(400).json({ success: false, error: 'Device ID and userId required' });
    }
    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const user = await getUserById(userId);
    if (!user || !user.active) {
      return res.status(400).json({ success: false, error: 'User not found or inactive' });
    }
    const updated = await assignDeviceToUser(id, userId);
    await addHistoryEntry({
      device_id: id,
      action: 'assigned',
      user_id: req.session.user?.id || null,
      details: { assigned_user_id: userId }
    });
    res.json({ success: true, message: 'Device assigned', data: updated });
  } catch (error) {
    console.error('Error in POST /devices/:id/assign:', error);
    res.status(500).json({ success: false, error: 'Failed to assign device', message: error.message });
  }
});

/**
 * POST /devices/:id/checkin - check in a device (unassign)
 */
app.post('/devices/:id/checkin', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid device ID' });
    }
    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const updated = await unassignDevice(id);
    await addHistoryEntry({
      device_id: id,
      action: 'checked_in',
      user_id: req.session.user?.id || null,
      details: {}
    });
    res.json({ success: true, message: 'Device checked in', data: updated });
  } catch (error) {
    console.error('Error in POST /devices/:id/checkin:', error);
    res.status(500).json({ success: false, error: 'Failed to check in device', message: error.message });
  }
});

/**
 * GET /devices/:id/history - history entries
 */
app.get('/devices/:id/history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid device ID' });
    }
    const device = await getDeviceById(id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const history = await getDeviceHistory(id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error in GET /devices/:id/history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history', message: error.message });
  }
});

/**
 * GET /devices - Get all devices
 * Returns an array of all devices sorted by ID
 */
app.get('/devices', async (req, res) => {
  try {
    const filters = {
      search: req.query.search || undefined,
      status: req.query.status || undefined
    };
    const devices = await getDevices(filters);
    res.json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    console.error('Error in GET /devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices',
      message: error.message
    });
  }
});

/**
 * GET /devices/export - Export devices to CSV
 */
app.get('/devices/export', async (req, res) => {
  try {
    const filters = {
      search: req.query.search || undefined,
      status: req.query.status || undefined
    };
    const devices = await getDevices(filters);
    const headers = [
      'hostname',
      'ip_address',
      'device_type',
      'manufacturer',
      'status',
      'assigned_to',
      'location'
    ];
    const escape = (val = '') => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = devices.map((d) =>
      [
        escape(d.hostname),
        escape(d.ip_address),
        escape(d.device_type_name || d.device_type),
        escape(d.manufacturer_name || ''),
        escape(d.status),
        escape(d.assigned_to_name || ''),
        escape(d.location || '')
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('devices.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error in GET /devices/export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export devices',
      message: error.message
    });
  }
});

/**
 * GET /devices/:id - Get device by ID
 * Returns a single device if found, 404 if not found
 */
app.get('/devices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID',
        message: 'Device ID must be a number'
      });
    }
    
    const device = await getDeviceById(id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `No device found with ID ${id}`
      });
    }
    
    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error(`Error in GET /devices/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device',
      message: error.message
    });
  }
});

/**
 * POST /devices - Create a new device
 * Requires: hostname, ip_address, device_type
 * Optional: location, status, notes
 */
app.post('/devices', async (req, res) => {
  try {
    const { hostname, ip_address, device_type, device_type_id, manufacturer_id, location, status, notes } = req.body;
    
    // Validate required fields
    if (!hostname || !ip_address || (!device_type && !device_type_id)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'hostname, ip_address, and device_type (or device_type_id) are required'
      });
    }
    
    // Basic IP address validation (simple format check)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ip_address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IP address format',
        message: 'IP address must be in format xxx.xxx.xxx.xxx'
      });
    }
    
    let validatedTypeId = device_type_id ? parseInt(device_type_id, 10) : null;
    if (validatedTypeId) {
      const types = await getDeviceTypes();
      if (!types.find((t) => t.id === validatedTypeId)) {
        return res.status(400).json({ success: false, error: 'Invalid device_type_id' });
      }
    }

    let validatedManufacturerId = manufacturer_id ? parseInt(manufacturer_id, 10) : null;
    if (validatedManufacturerId) {
      const mans = await getManufacturers();
      if (!mans.find((m) => m.id === validatedManufacturerId)) {
        return res.status(400).json({ success: false, error: 'Invalid manufacturer_id' });
      }
    }
    
    // Validate status if provided
    if (status && !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'status must be one of: active, inactive, maintenance'
      });
    }
    
    const newDevice = await createDevice({
      hostname,
      ip_address,
      device_type,
      device_type_id: validatedTypeId,
      manufacturer_id: validatedManufacturerId,
      location,
      status,
      notes
    });
    
    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: newDevice
    });
  } catch (error) {
    console.error('Error in POST /devices:', error);
    
    // Handle unique constraint violations (e.g., duplicate hostname)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'A device with this hostname or IP address already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create device',
      message: error.message
    });
  }
});

/**
 * PUT /devices/:id - Update an existing device
 * All fields are optional (only provided fields will be updated)
 */
app.put('/devices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID',
        message: 'Device ID must be a number'
      });
    }
    
    const { hostname, ip_address, device_type, device_type_id, manufacturer_id, location, status, notes } = req.body;
    
    // Validate IP address format if provided
    if (ip_address) {
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(ip_address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid IP address format',
          message: 'IP address must be in format xxx.xxx.xxx.xxx'
        });
      }
    }
    
    if (device_type_id) {
      const parsed = parseInt(device_type_id, 10);
      const types = await getDeviceTypes();
      if (!types.find((t) => t.id === parsed)) {
        return res.status(400).json({ success: false, error: 'Invalid device_type_id' });
      }
      req.body.device_type_id = parsed;
    }

    if (manufacturer_id) {
      const parsed = parseInt(manufacturer_id, 10);
      const mans = await getManufacturers();
      if (!mans.find((m) => m.id === parsed)) {
        return res.status(400).json({ success: false, error: 'Invalid manufacturer_id' });
      }
      req.body.manufacturer_id = parsed;
    }
    
    // Validate status if provided
    if (status && !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'status must be one of: active, inactive, maintenance'
      });
    }
    
    const existing = await getDeviceById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `No device found with ID ${id}`
      });
    }

    const updatedDevice = await updateDevice(id, {
      hostname,
      ip_address,
      device_type,
      device_type_id: req.body.device_type_id,
      manufacturer_id: req.body.manufacturer_id,
      location,
      status,
      notes
    });
    
    if (updatedDevice && existing.status !== updatedDevice.status) {
      await addHistoryEntry({
        device_id: id,
        action: 'status_changed',
        user_id: req.session.user?.id || null,
        details: { from: existing.status, to: updatedDevice.status }
      });
    }

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: updatedDevice
    });
  } catch (error) {
    console.error(`Error in PUT /devices/${req.params.id}:`, error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'A device with this hostname or IP address already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update device',
      message: error.message
    });
  }
});

/**
 * DELETE /devices/:id - Delete a device by ID
 */
app.delete('/devices/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID',
        message: 'Device ID must be a number'
      });
    }
    
    const deletedDevice = await deleteDevice(id);
    
    if (!deletedDevice) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `No device found with ID ${id}`
      });
    }
    
    res.json({
      success: true,
      message: 'Device deleted successfully',
      data: deletedDevice
    });
  } catch (error) {
    console.error(`Error in DELETE /devices/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete device',
      message: error.message
    });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ==================== SERVER START ====================

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 Frontend URL: ${FRONTEND_URL}`);
  console.log(`📊 Database: ${process.env.DB_DATABASE || 'network_inventory'}`);
  // Create default admin user if missing
  ensureDefaultAdmin().catch((err) =>
    console.error('Failed to ensure default admin user:', err)
  );
  ensureDefaultLookups().catch((err) =>
    console.error('Failed to ensure default device lookups:', err)
  );
  console.log('✅ API is ready to accept requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});
