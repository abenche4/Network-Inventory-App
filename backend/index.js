// Express.js server for Network Device Inventory API
// Provides RESTful API endpoints for CRUD operations on network devices

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getUserByEmail,
  getUserById,
  getUsers,
  ensureDefaultAdmin
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
 * GET /devices - Get all devices
 * Returns an array of all devices sorted by ID
 */
app.get('/devices', async (req, res) => {
  try {
    const devices = await getDevices();
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
    const { hostname, ip_address, device_type, location, status, notes } = req.body;
    
    // Validate required fields
    if (!hostname || !ip_address || !device_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'hostname, ip_address, and device_type are required'
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
    
    // Validate device_type is one of the allowed values
    const allowedTypes = ['Router', 'Switch', 'Firewall', 'Server', 'Access Point', 'Other'];
    if (!allowedTypes.includes(device_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid device type',
        message: `device_type must be one of: ${allowedTypes.join(', ')}`
      });
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
    
    const { hostname, ip_address, device_type, location, status, notes } = req.body;
    
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
    
    // Validate device_type if provided
    if (device_type) {
      const allowedTypes = ['Router', 'Switch', 'Firewall', 'Server', 'Access Point', 'Other'];
      if (!allowedTypes.includes(device_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid device type',
          message: `device_type must be one of: ${allowedTypes.join(', ')}`
        });
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
    
    const updatedDevice = await updateDevice(id, {
      hostname,
      ip_address,
      device_type,
      location,
      status,
      notes
    });
    
    if (!updatedDevice) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        message: `No device found with ID ${id}`
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
